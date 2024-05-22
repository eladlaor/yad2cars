import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import {
  carFamilyTypeMapping,
  manufacturerMapping,
  upperBoundYearKeywords,
  lowerBoundYearKeywords,
  lowerBoundPriceKeywords,
  upperBoundPriceKeywords,
} from "../../utils/mappings";

const MAX_RETRIES = 3;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const processRange = (
  values: string[],
  isLowerBound: boolean,
  isUpperBound: boolean
): string => {
  const numericValues = values
    .map((value) => parseInt(value, 10))
    .filter((value) => !isNaN(value));

  if (numericValues.length === 0) return "";

  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);

  if (isLowerBound && !isUpperBound) {
    return `${minValue}--1`;
  } else if (isUpperBound && !isLowerBound) {
    return `-1-${maxValue}`;
  } else {
    return `${minValue}-${maxValue}`;
  }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { inputText } = req.body;

  const baseSystemContent = `
    You are an assistant that converts Hebrew text into search query parameters for the yad2.co.il vehicle listings site.
    The output should be a JSON object with the following keys: 
    carFamilyType, 
    manufacturer, 
    year, isUpperBoundYear, isLowerBoundYear, 
    price, isUpperBoundPrice, isLowerBoundPrice.
    
    Ensure that 'carFamilyType', 'manufacturer', 'year' and 'price' are arrays, even if they contain only one element.
    
    The mappings for carFamilyType:
    ${Object.entries(carFamilyTypeMapping)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")}
  
    The mappings for manufacturer:
    ${manufacturerMapping.map((m) => `${m.title}: ${m.id}`).join(", ")}
    
    Set the json values accordingly to the values of the above maps.
    
    Regarding the year param:
    The format for year values are expected to be either 4 digit (2014) or shortcut two digit (14').
    If you identify a shortcut format of a year, transform it to a 4 digit format.
  
    isUpperBoundYear should be boolean:
    set to true if you identify words that imply an upper bound, such as: ${upperBoundYearKeywords}.
    false otherwise.
  
    isLowerBoundYear should be boolean:
    same logic as isUpperBoundYear, but referring to a lower bound, with words like ${lowerBoundYearKeywords}.
    
    isUpperBoundPrice should be boolean:
    set to true if you identify words that imply an upper bound, such as: ${upperBoundPriceKeywords}.
    false otherwise.
  
    isLowerBoundPrice should be boolean:
    same logic as isUpperBoundPrice, but referring to a lower bound, with words like ${lowerBoundPriceKeywords}.
  `;

  const generateSearchParams = async (
    retries: number,
    gptCorrections: string[] = []
  ): Promise<string> => {
    try {
      let systemContent = baseSystemContent;
      if (gptCorrections.length > 0) {
        systemContent += `Please be sure to correct the following: ${gptCorrections.join(
          ", "
        )}`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          {
            role: "user",
            content: inputText,
          },
        ],
        max_tokens: 200,
      });

      const jsonResponse = response?.choices[0]?.message?.content?.trim();
      if (!jsonResponse) {
        gptCorrections.push("Received an empty response.");
        throw new Error("No JSON response!");
      }

      const searchParams = JSON.parse(jsonResponse);

      const urlParams = new URLSearchParams();

      if (searchParams.carFamilyType && searchParams.carFamilyType.length > 0) {
        urlParams.append("carFamilyType", searchParams.carFamilyType.join(","));
      }

      if (searchParams.manufacturer && searchParams.manufacturer.length > 0) {
        urlParams.append("manufacturer", searchParams.manufacturer.join(","));
      }

      if (searchParams.year && searchParams.year.length > 0) {
        urlParams.append(
          "year",
          processRange(
            searchParams.year,
            searchParams.isLowerBoundYear,
            searchParams.isUpperBoundYear
          )
        );
      }

      if (searchParams.price && searchParams.price.length > 0) {
        urlParams.append(
          "price",
          processRange(
            searchParams.price,
            searchParams.isLowerBoundPrice,
            searchParams.isUpperBoundPrice
          )
        );
      }

      return `https://www.yad2.co.il/vehicles/cars?${urlParams.toString()}`;
    } catch (error) {
      if (retries > 0) {
        console.error(`Retrying... (${MAX_RETRIES - retries + 1})`);
        return generateSearchParams(retries - 1, gptCorrections);
      } else {
        throw new Error(
          "Failed to generate search parameters after multiple attempts"
        );
      }
    }
  };

  try {
    const searchUrl = await generateSearchParams(MAX_RETRIES);
    console.log("Generated URL:", searchUrl);
    res.status(200).json({ searchUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate search parameters" });
  }
};

export default handler;
