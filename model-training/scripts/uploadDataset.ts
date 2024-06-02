import fs from "fs";
import path from "path";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const uploadDataset = async () => {
  const filePath = path.join(__dirname, "../datasets/yad2Examples.jsonl");
  const fileStream = fs.createReadStream(filePath);

  try {
    const response = await openai.files.create({
      file: fileStream,
      purpose: "fine-tune",
    });

    console.log("File uploaded:", response);
    return response.id;
  } catch (error) {
    console.error("Error uploading dataset:", error);
  }
};

uploadDataset()
  .then((fileId) => {
    if (fileId) {
      console.log("Dataset File ID:", fileId);
    }
  })
  .catch((error) => {
    console.error("Error during dataset upload:", error);
  });
