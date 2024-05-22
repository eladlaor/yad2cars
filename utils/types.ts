export type OpenAIChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ResponseKeys = {
  carFamilyType: string[] | null;
  manufacturer: string[] | null;
  year: string | null;
  price: string | null;
};

export const ResponseKeysTypeString = `
{
  carFamilyType: string[] | null, 
  manufacturer: string[] | null, 
  year: string | null, 
  price: string | null
}
`;

export function validateResponseFormat(response: any): string[] {
  const errors: string[] = [];

  if (response === null || typeof response !== "object") {
    errors.push("Response is not a valid object");
    return errors;
  }

  const expectedKeys: (keyof ResponseKeys)[] = [
    "carFamilyType",
    "manufacturer",
    "year",
    "price",
  ];

  expectedKeys.forEach((key) => {
    if (!(key in response)) {
      errors.push(`Missing key: ${key}`);
    } else {
      switch (key) {
        case "carFamilyType":
        case "manufacturer":
          if (response[key] !== null && !Array.isArray(response[key])) {
            errors.push(
              `Invalid type for key: ${key}. Expected an array or null`
            );
          }
          break;
        case "year":
        case "price":
          if (response[key] !== null && typeof response[key] !== "string") {
            errors.push(
              `Invalid type for key: ${key}. Expected a string or null`
            );
          }
          break;
        default:
          errors.push(`Unexpected key: ${key}`);
      }
    }
  });

  return errors;
}
