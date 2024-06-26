import fs from "fs";
import path from "path";
import {
  manufacturerMapping,
  carFamilyTypeMapping,
} from "../../utils/mappings";
import { ResponseKeys, ResponseKeysTypeString } from "../../utils/types";

const getRandomElement = (arr: any[]) => {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

const getRandomRange = (start: number, end: number) => {
  const lowerBound =
    Math.random() < 0.5
      ? null
      : Math.floor(Math.random() * (end - start + 1)) + start;
  const upperBound = lowerBound
    ? Math.random() < 0.5
      ? null
      : Math.floor(Math.random() * (end - lowerBound + 1)) + lowerBound
    : null;
  return { lowerBound, upperBound };
};

const cleanUserPrompt = (userPrompt: string) => {
  return userPrompt
    .replace(/ עד -$/, "")
    .replace(/ ל-$/, "")
    .replace(/ -$/, "")
    .replace(/  +/g, " ")
    .trim();
};

const generateExample = (): any => {
  const carFamilyTypes = Array.from(
    { length: Math.floor(Math.random() * 2) },
    () => getRandomElement(Object.keys(carFamilyTypeMapping))
  ).filter(Boolean);

  const manufacturers = Array.from(
    { length: Math.floor(Math.random() * 2) },
    () => getRandomElement(manufacturerMapping)
  ).filter(Boolean);

  const { lowerBound: yearStart, upperBound: yearEnd } = getRandomRange(
    2000,
    2023
  );
  const { lowerBound: priceStart, upperBound: priceEnd } = getRandomRange(
    10000,
    100000
  );

  const promptVariations = ["מחפש", "מעוניין ב", "רוצה למצוא", "צריך"];
  let userPrompt = getRandomElement(promptVariations) || "מחפש"; // default prompt if null

  if (carFamilyTypes.length) {
    userPrompt += ` ${carFamilyTypes.join(" ")}`;
  }
  if (manufacturers.length) {
    userPrompt += ` ${manufacturers.map((m) => m.title).join(" ")}`;
  }
  if (yearStart || yearEnd) {
    if (yearStart && yearEnd) {
      userPrompt += ` בין השנים ${yearStart} ל-${yearEnd}`;
    } else if (yearStart) {
      userPrompt += ` משנת ${yearStart}`;
    } else {
      userPrompt += ` עד שנה ${yearEnd}`;
    }
  }
  if (priceStart || priceEnd) {
    if (priceStart && priceEnd) {
      userPrompt += ` במחיר של ${priceStart} עד ${priceEnd}`;
    } else if (priceStart) {
      userPrompt += ` במחיר של לפחות ${priceStart}`;
    } else {
      userPrompt += ` במחיר של עד ${priceEnd}`;
    }
  }

  const assistantResponse: ResponseKeys = {
    carFamilyType: carFamilyTypes.length
      ? carFamilyTypes.map((type) => carFamilyTypeMapping[type].toString())
      : null,
    manufacturer: manufacturers.length
      ? manufacturers.map((m) => m.id.toString())
      : null,
    year: yearStart ? `${yearStart}-${yearEnd || "-1"}` : null,
    price: priceStart ? `${priceStart}-${priceEnd || "-1"}` : null,
  };

  userPrompt = cleanUserPrompt(userPrompt);

  return {
    messages: [
      {
        role: "system",
        content: `
          You are an assistant that converts Hebrew text into search query parameters for the yad2.co.il vehicle listings site.

          The output should be a JSON object with the following four keys: 
          ${ResponseKeysTypeString}

          The mappings for carFamilyType:
          ${Object.entries(carFamilyTypeMapping)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")}
        
          The mappings for manufacturer:
          ${manufacturerMapping.map((m) => `${m.title}: ${m.id}`).join(", ")}
          
          Set the json values for carFamilyType and manufacturer accordingly to the above maps.
          
          Regarding the year param:
          The format for year values are expected to be either 4 digit (2014) or shortcut two digit (14').
          If you identify a shortcut format of a year, transform it to a 4 digit format.
          There are four possibilities for what the user wants regarding the year param.
          Here are cases with the corresponding return values for 'year' which are expected: 
            - if no year is specified: year=null
            - if only a lower bound is specified: year='{valueOfSpecifiedYear}--1'
            - if only an upper bound is specified: year='-1-{valueOfSpecifiedYear}'
            - if a range of both lower and upper bounds is specified: year='{lowerBound}-{upperBound}'

          Regarding the price param:
          The logic is like the one of the 'year' param.
        `,
      },
      { role: "user", content: userPrompt },
      { role: "assistant", content: JSON.stringify(assistantResponse) },
    ],
  };
};

const examples = Array.from({ length: 120 }, generateExample);

const outputPath = path.join(__dirname, "../datasets/yad2Examples.jsonl");
fs.writeFileSync(
  outputPath,
  examples.map((example) => JSON.stringify(example)).join("\n"),
  "utf8"
);

console.log("Dataset generated and saved to", outputPath);
