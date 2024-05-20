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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_RETRIES = 3;

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
  const staticSystemContent = `
  You are an assistant that converts Hebrew text into search query parameters for the yad2.co.il vehicle listings site.
  The output should be a JSON object with the following keys: 
  carFamilyType, 
  manufacturer, 
  year, isUpperBoundYear, isLowerBoundYear, 
  price, isUpperBoundPrice, isLowerBoundPrice.
    
  Ensure that carFamilyType and manufacturer are arrays, even if they contain only one element.
    
  Here are the mappings for carFamilyType:
  ${Object.entries(carFamilyTypeMapping)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ")}
  
  Here are the mappings for manufacturer:
  ${manufacturerMapping.map((m) => `${m.title}: ${m.id}`).join(", ")}
    
  Set the json values accordingly to the values of the above maps.
    
  Regarding the year param:
  Ensure the value of 'year' is an array, even if it contains only one element.
  The format for year values are expected to be either 4 digit (2014) or shortcut two digit (14').
  If you identify a shortcut format of a year, transform it to a 4 digit format.
  
  isUpperBoundYear should be boolean:
  set to true if you identify words that imply an upper bound, such as: ${upperBoundYearKeywords}.
  false otherwise.
  
  isLowerBoundYear should be boolean:
  same logic as isUpperBoundYear, but referring to a lower bound, with words like ${lowerBoundYearKeywords}.
    
  Regarding the price param:
  Ensure the value of 'price' is an array, even if it contains only one element.
  
  isUpperBoundPrice should be boolean:
  set to true if you identify words that imply an upper bound, such as: ${upperBoundPriceKeywords}.
  false otherwise.
  
  isLowerBoundPrice should be boolean:
  same logic as isUpperBoundPrice, but referring to a lower bound, with words like ${lowerBoundPriceKeywords}.
  `;

  const generateSearchParams = async (retries: number): Promise<string> => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: staticSystemContent,
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
        throw new Error("No JSON response!");
      }

      // TODO: here i want to create a verification logic of what i got back, and retry if needed.
      // i can add additional notes after retrying, to the assistant, with a dynamically built string of notes,
      // according to the error I received.

      const searchParams = JSON.parse(jsonResponse);

      const urlParams = new URLSearchParams();

      if (searchParams.carFamilyType) {
        const carTypeValues = Array.isArray(searchParams.carFamilyType)
          ? searchParams.carFamilyType
          : [searchParams.carFamilyType];
        urlParams.append("carFamilyType", carTypeValues.join(","));
      }

      if (searchParams.manufacturer) {
        const manufacturerValues = Array.isArray(searchParams.manufacturer)
          ? searchParams.manufacturer
          : [searchParams.manufacturer];
        urlParams.append("manufacturer", manufacturerValues.join(","));
      }

      if (searchParams.year) {
        urlParams.append(
          "year",
          processRange(
            searchParams.year,
            searchParams.isLowerBoundYear,
            searchParams.isUpperBoundYear
          )
        );
      }

      if (searchParams.price) {
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
        return generateSearchParams(retries - 1);
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
