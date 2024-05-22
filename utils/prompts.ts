import { carFamilyTypeMapping, manufacturerMapping } from "./mappings";
import { ResponseKeys, ResponseKeysTypeString } from "./types";

export const baseSystemPrompt = `
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
