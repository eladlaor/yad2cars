import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { examples, baseSystemPrompt } from "../../utils/prompts";
import { OpenAIChatMessage, validateResponseFormat } from "../../utils/types";
import { YAD2_CAR_SEARCH_URL } from "../../utils/constants";

// TODO: add a test file!
// if fails - notify the user...

const MAX_RETRIES = 3;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { inputText } = req.body;

  const generateSearchParams = async (
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
        return generateSearchParams(retries - 1);
      }

      gptCorrections.push(...validateResponseFormat(jsonResponse));
      if (gptCorrections.length) {
        return generateSearchParams(retries - 1, gptCorrections);
      }

      const searchParams = JSON.parse(jsonResponse);

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
    } catch (error) {
      if (retries) {
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
