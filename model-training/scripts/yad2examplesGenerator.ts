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

  const userPrompt = `מחפש ${carFamilyTypes.join(" ")} ${manufacturers
    .map((m) => m.title)
    .join(" ")}${
    yearStart
      ? ` בין השנים ${yearStart} ל-${yearEnd}`
      : yearEnd
      ? ` עד שנה ${yearEnd}`
      : ""
  }${priceStart ? ` במחיר של ${priceStart} עד ${priceEnd}` : ""}`;

  const assistantResponse: ResponseKeys = {
    carFamilyType: carFamilyTypes.length
      ? carFamilyTypes.map((type) => carFamilyTypeMapping[type].toString())
      : null,
    manufacturer:
      manufacturers.length > 0 ? manufacturers.map((m) => m.id) : null,
    year: yearStart ? `${yearStart}-${yearEnd || "-1"}` : null,
    price: priceStart ? `${priceStart}-${priceEnd || "-1"}` : null,
  };

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
