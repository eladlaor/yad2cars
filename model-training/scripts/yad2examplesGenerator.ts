import fs from "fs";
import path from "path";
import {
  manufacturerMapping,
  carFamilyTypeMapping,
} from "../../utils/mappings";
import { ResponseKeys } from "../../utils/types";

const getRandomElement = (arr: any[]) =>
  arr[Math.floor(Math.random() * arr.length)];

const generateExample = (): {
  userPrompt: string;
  assistantResponse: ResponseKeys;
} => {
  const carFamilyTypes = Array.from(
    { length: Math.floor(Math.random() * 2) },
    () => getRandomElement(Object.keys(carFamilyTypeMapping))
  );
  const manufacturers = Array.from(
    { length: Math.floor(Math.random() * 2) },
    () => getRandomElement(manufacturerMapping)
  );

  const yearStart =
    Math.random() < 0.5
      ? null
      : Math.floor(Math.random() * (2020 - 2000 + 1)) + 2000;
  const yearEnd = yearStart
    ? Math.random() < 0.5
      ? null
      : Math.floor(Math.random() * (2023 - yearStart + 1)) + yearStart
    : null;

  const priceStart =
    Math.random() < 0.5
      ? null
      : Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000;
  const priceEnd = priceStart
    ? Math.random() < 0.5
      ? null
      : Math.floor(Math.random() * (100000 - priceStart + 1)) + priceStart
    : null;

  const promptVariations = ["מחפש", "מעוניין ב", "רוצה למצוא", "צריך"];
  let userPrompt = getRandomElement(promptVariations);

  if (carFamilyTypes.length > 0) {
    userPrompt += ` ${carFamilyTypes.join(" ")}`;
  }
  if (manufacturers.length > 0) {
    userPrompt += ` ${manufacturers.map((m) => m.title).join(" ")}`;
  }
  if (yearStart || yearEnd) {
    if (yearStart && yearEnd) {
      userPrompt += ` בין השנים ${yearStart} ל-${yearEnd}`;
    } else if (yearStart) {
      userPrompt += ` משנת ${yearStart}`;
    } else if (yearEnd) {
      userPrompt += ` עד שנה ${yearEnd}`;
    }
  }
  if (priceStart || priceEnd) {
    if (priceStart && priceEnd) {
      userPrompt += ` במחיר של ${priceStart} עד ${priceEnd}`;
    } else if (priceStart) {
      userPrompt += ` במחיר של לפחות ${priceStart}`;
    } else if (priceEnd) {
      userPrompt += ` במחיר של עד ${priceEnd}`;
    }
  }

  const assistantResponse: ResponseKeys = {
    carFamilyType:
      carFamilyTypes.length > 0
        ? carFamilyTypes.map((type) => carFamilyTypeMapping[type].toString())
        : null,
    manufacturer:
      manufacturers.length > 0
        ? manufacturers.map((m) => m.id.toString())
        : null,
    year: yearStart ? `${yearStart}-${yearEnd || "-1"}` : null,
    price: priceStart ? `${priceStart}-${priceEnd || "-1"}` : null,
  };

  userPrompt = userPrompt
    .replace(/ עד -$/, "")
    .replace(/ ל-$/, "")
    .replace(/  +/g, " ")
    .trim();

  return { userPrompt, assistantResponse };
};

const examples = Array.from({ length: 120 }, generateExample);

const outputPath = path.join(__dirname, "../datasets/yad2Examples.jsonl");
fs.writeFileSync(
  outputPath,
  examples.map((example) => JSON.stringify(example)).join("\n"),
  "utf8"
);

console.log("Dataset generated and saved to", outputPath);
