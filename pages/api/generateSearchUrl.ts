import { NextApiRequest, NextApiResponse } from "next";
import { OpenAIChatMessage, validateResponseFormat } from "../../utils/types";
import { baseSystemPrompt } from "../../utils/prompts";
import {
  YAD2_CAR_SEARCH_URL,
  MAX_RETRIES,
  FINE_TUNED_MODEL_ID,
} from "../../utils/constants";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end("Not Allowed");
  }

  const { inputText } = req.body;

  try {
    const searchUrl = await generateSearchUrl(inputText, MAX_RETRIES);
    res.status(200).json({ searchUrl });
  } catch (error: any) {
    res.status(500).json({
      error: `${MAX_RETRIES} ניסיונות לא הצליחו. אפשר לרענן את הדף ולנסות מחדש. השגיאה שהתקבלה: ${
        error?.message || error
      }.`,
    });
  }
}

const generateSearchUrl = async (
  inputText: string,
  retries: number,
  gptCorrections: string[] = []
): Promise<string> => {
  try {
    let systemPrompt = baseSystemPrompt;
    if (gptCorrections.length) {
      systemPrompt += `Please be sure to correct the following: ${gptCorrections.join(
        ", "
      )}`;
    }

    const messagesForGpt: OpenAIChatMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: inputText,
      },
    ];

    const response = await openai.chat.completions.create({
      model: FINE_TUNED_MODEL_ID,
      messages: messagesForGpt,
      max_tokens: 250,
    });

    const jsonResponse = response?.choices[0]?.message?.content?.trim();
    if (!jsonResponse) {
      return generateSearchUrl(inputText, retries - 1, gptCorrections);
    }

    const searchParams = JSON.parse(jsonResponse);
    gptCorrections.push(...validateResponseFormat(searchParams));

    if (gptCorrections.length) {
      console.error(
        `Invalid response format. Retry ${
          MAX_RETRIES - retries + 1
        } of ${MAX_RETRIES}`
      );
      return generateSearchUrl(inputText, retries - 1, gptCorrections);
    }

    const urlParams = new URLSearchParams();

    for (const key of Object.keys(searchParams)) {
      if (searchParams[key]) {
        if (Array.isArray(searchParams[key])) {
          urlParams.append(key, searchParams[key].join());
        } else {
          urlParams.append(key, searchParams[key]);
        }
      }
    }

    return `${YAD2_CAR_SEARCH_URL}?${urlParams}`;
  } catch (error: any) {
    if (retries > 0) {
      console.error(
        `Error: ${error.message || error || "Unknown"}. Retry (${
          MAX_RETRIES - retries + 1
        }) of ${MAX_RETRIES}`
      );
      return generateSearchUrl(inputText, retries - 1, gptCorrections);
    } else {
      throw new Error(error);
    }
  }
};
