import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import {
  carFamilyTypeMapping,
  manufacturerMapping,
} from "../../utils/mappings";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_RETRIES = 3;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { inputText } = req.body;

  const generateSearchParams = async (retries: number): Promise<string> => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `
              You are an assistant that converts Hebrew text into search query parameters for the yad2.co.il vehicle listings site.
              The output should be a JSON object with the following keys: carFamilyType, manufacturer, year, and price.
              
              Ensure that carFamilyType and manufacturer are arrays, even if they contain only one element.
              Ensure that price is a range if specified as such.
              The year can be a single year or a range.

              Here are the mappings for carFamilyType:
              ${Object.entries(carFamilyTypeMapping)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ")}

              Here are the mappings for manufacturer:
              ${manufacturerMapping
                .map((m) => `${m.title}: ${m.id}`)
                .join(", ")}
            `,
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
        urlParams.append("year", searchParams.year);
      }

      if (searchParams.price) {
        if (typeof searchParams.price === "string") {
          urlParams.append("price", searchParams.price);
        } else if (Array.isArray(searchParams.price)) {
          urlParams.append("price", searchParams.price.join("-"));
        } else if (typeof searchParams.price === "object") {
          const priceString = `${searchParams.price.min || ""}-${
            searchParams.price.max || ""
          }`;
          urlParams.append("price", priceString);
        }
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
