import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { examples, baseSystemPrompt } from "../../utils/prompts";
import { OpenAIChatMessage, validateResponseFormat } from "../../utils/types";
import { YAD2_CAR_SEARCH_URL, MAX_RETRIES } from "../../utils/constants";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);

    return res.status(405).end(`Method ${req.method} Not Allowed`);
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

    const messagesForGpt4: OpenAIChatMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...examples.flatMap(
        (example) =>
          [
            {
              role: "user",
              content: example.userPrompt,
            },
            {
              role: "assistant",
              content: JSON.stringify(example.assistantResponse),
            },
          ] as OpenAIChatMessage[]
      ),
      {
        role: "user",
        content: inputText,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messagesForGpt4,
      max_tokens: 200,
    });

    const jsonResponse = response?.choices[0]?.message?.content?.trim();
    if (!jsonResponse) {
      return generateSearchUrl(inputText, retries - 1, gptCorrections);
    }

    const parsedResponse = JSON.parse(jsonResponse);
    gptCorrections.push(...validateResponseFormat(parsedResponse));

    if (gptCorrections.length) {
      return generateSearchUrl(inputText, retries - 1, gptCorrections);
    }

    const searchParams = parsedResponse;

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
      console.error(`Retrying... (${MAX_RETRIES - retries + 1})`);
      return generateSearchUrl(inputText, retries - 1, gptCorrections);
    } else {
      throw new Error(error);
    }
  }
};
