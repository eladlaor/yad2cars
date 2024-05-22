import "../styles/globals.css";
import type { AppProps } from "next/app";
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
