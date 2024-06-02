import OpenAI from "openai";
import dotenv from "dotenv";
import { EXAMPLES_DATASET_FILE_ID } from "../../utils/constants";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const createFineTuneJob = async (fileId: string) => {
  try {
    const response = await openai.fineTuning.jobs.create({
      training_file: fileId,
      model: "gpt-3.5-turbo",
      hyperparameters: {
        n_epochs: 8,
      },
    });

    console.log("Fine-tune job created:", response);
    return response.id;
  } catch (error) {
    console.error("Error creating fine-tune job:", error);
  }
};

createFineTuneJob(EXAMPLES_DATASET_FILE_ID)
  .then((jobId) => {
    if (jobId) {
      console.log("Fine-tune Job ID:", jobId);
    }
  })
  .catch((error) => {
    console.error("Error during fine-tune job creation:", error);
  });
