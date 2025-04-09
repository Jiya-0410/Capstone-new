import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { name, category, price, margin, slottingFee } = req.body;

    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = "1fz3oklmHW9zKGMqILCRfRka0hBTjD3mdaDFmP0P0GwE";

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Products!A:E",
      valueInputOption: "RAW",
      requestBody: {
        values: [[name, category, price, margin, slottingFee]],
      },
    });

    res.status(200).json({ message: "Product saved" });
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
