export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const base64Url = image.startsWith("data:image") ? image : `data:image/jpeg;base64,${image}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.2-11b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert OCR and data extraction AI. Extract the following fields from this invoice image:
- customer_name
- phone
- invoice_number
- invoice_date (format as YYYY-MM-DD if possible)
- due_date (format as YYYY-MM-DD if possible)
- amount (numbers only, no currency symbols, just the total amount)

Return ONLY a valid JSON object with these exact keys. Do not include any markdown formatting, backticks, or other text. If a field is missing, leave it as an empty string.`,
            },
            {
              type: "image_url",
              image_url: {
                url: base64Url,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || "{}";
    
    const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse JSON from Vision model:", jsonStr);
      return NextResponse.json({ error: "Failed to parse invoice data." }, { status: 500 });
    }

    return NextResponse.json(parsedData);
  } catch (err: unknown) {
    console.error("Scan error:", err);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
