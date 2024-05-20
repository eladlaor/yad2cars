// pages/api/generateSearchParams.ts
import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { inputText } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that converts Hebrew text into search query parameters for the yad2.co.il vehicle listings site.",
        },
        {
          role: "user",
          content: `Convert the following text into search parameters for yad2.co.il in the form of a JSON object with keys carFamilyType, manufacturer, year, and price: ${inputText}`,
        },
      ],
      max_tokens: 200,
    });

    const jsonResponse = response?.choices[0]?.message?.content?.trim();
    if (!jsonResponse) {
      throw new Error("no json response!");
    }
    const searchParams = JSON.parse(jsonResponse);

    const urlParams = new URLSearchParams();

    if (searchParams.carFamilyType) {
      if (Array.isArray(searchParams.carFamilyType)) {
        urlParams.append("carFamilyType", searchParams.carFamilyType.join(","));
      } else {
        urlParams.append("carFamilyType", searchParams.carFamilyType);
      }
    }

    if (searchParams.manufacturer) {
      if (Array.isArray(searchParams.manufacturer)) {
        urlParams.append("manufacturer", searchParams.manufacturer.join(","));
      } else {
        urlParams.append("manufacturer", searchParams.manufacturer);
      }
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

    const searchUrl = `https://www.yad2.co.il/vehicles/cars?${urlParams.toString()}`;
    console.log("Generated URL:", searchUrl);

    // Return the generated URL to the frontend
    res.status(200).json({ searchUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate search parameters" });
  }
};

export default handler;
