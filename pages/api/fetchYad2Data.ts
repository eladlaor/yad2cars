import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { searchUrl } = req.body;

  try {
    const yad2Response = await axios.get(searchUrl);

    res.status(200).json({ data: yad2Response.data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch data from Yad2" });
  }
};

export default handler;
