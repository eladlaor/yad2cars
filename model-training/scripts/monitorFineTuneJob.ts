import OpenAI from "openai";
import dotenv from "dotenv";
import { FINE_TUNE_JOB_ID } from "../../utils/constants";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const monitorFineTuneJob = async (jobId: string) => {
  try {
    const response = await openai.fineTuning.jobs.retrieve(jobId);
    console.log("Fine-tune job status:", response);

    if (response.status === "succeeded") {
      console.log("Fine-tuning completed successfully!");
      console.log("Fine-tuned model ID:", response.fine_tuned_model);
    } else if (response.status === "failed") {
      console.error("Fine-tuning failed:", response);
    } else {
      console.log("Fine-tuning in progress...");
    }
  } catch (error) {
    console.error("Error monitoring fine-tune job:", error);
  }
};

monitorFineTuneJob(FINE_TUNE_JOB_ID);
