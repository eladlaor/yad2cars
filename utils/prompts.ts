import { carFamilyTypeMapping, manufacturerMapping } from "./mappings";
import { ResponseKeys, ResponseKeysTypeString } from "./types";

export const baseSystemPrompt = `
    You are an assistant that converts Hebrew text into search query parameters for the yad2.co.il vehicle listings site. 
    Provide the output as JSON with keys: carFamilyType, manufacturer, year, price.
    The output should be a JSON object with the following four keys: 
    ${ResponseKeysTypeString} .
    Be sure to use the mappings you were trained on, to correctly assign the corresponding numeric value to each manufacturer and carFamilyType.

    Regarding the year param format: 
      - if no year is specified: year=null
      - if only a lower bound is specified: year='{valueOfSpecifiedYear}--1'
      - if only an upper bound is specified: year='-1-{valueOfSpecifiedYear}'
      - if a range of both lower and upper bounds is specified: year='{lowerBound}-{upperBound}'

    Regarding the price param:
    The logic is like the one of the 'year' param.
    `;

export const examples = [
  {
    userPrompt: "מחפש טיוטה סיאת שנה 2018 ומעלה",
    assistantResponse: {
      carFamilyType: null,
      manufacturer: ["19", "37"], // טויוטה, סיאט (תיקון שגיעת חתיב)
      year: "2018--1",
      price: null,
    } as ResponseKeys,
  },
  {
    userPrompt: "מחפש רכב יוקרה מנהלים של אודי ובמו במחיר של 100 עד 200 אלף שח",
    assistantResponse: {
      carFamilyType: ["8", "3"], // יוקרה, מנהלים
      manufacturer: ["1", "7"], // אאודי, ב.מ.וו
      year: null,
      price: "100000-200000",
    } as ResponseKeys,
  },
  {
    userPrompt: "מחפש ג'יפים טויוטה לנדרובר בין השנים 2015 ל-2020",
    assistantResponse: {
      carFamilyType: ["5"], // ג'יפים
      manufacturer: ["24"], //  לנדרובר
      year: "2015-2020",
      price: null,
    } as ResponseKeys,
  },
  {
    userPrompt: "מחפש מאזדה משנת 2010 במחיר של לפחות 50 אלף שח",
    assistantResponse: {
      carFamilyType: null,
      manufacturer: ["27"], // מאזדה
      year: "2010--1",
      price: "50000--1",
    } as ResponseKeys,
  },
  {
    userPrompt: "מחפש רכב בין השנים 2012 ל-2016 במחיר שבין 30 ל-60 אלף שח",
    assistantResponse: {
      carFamilyType: null,
      manufacturer: null,
      year: "2012-2016",
      price: "30000-60000",
    } as ResponseKeys,
  },
];
