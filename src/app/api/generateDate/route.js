import { NextResponse } from 'next/server';
import axios from 'axios';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type');

    let wasteName = '';
    let wasteImageData = null;

    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      wasteName = formData.get('wasteName') || '';
      const wasteImage = formData.get('wasteImage');

      if (wasteImage && wasteImage instanceof Blob) {
        const uploadDir = join(process.cwd(), 'tmp', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        const uniqueId = uuidv4();
        const extension = wasteImage.name ? wasteImage.name.split('.').pop() : 'jpg';
        const filename = `${uniqueId}.${extension}`;
        const filepath = join(uploadDir, filename);

        const bytes = await wasteImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        wasteImageData = {
          path: filepath,
          filename: filename
        };

        if (!wasteName) wasteName = "unidentified waste";
      }
    } else {
      const body = await req.json();
      wasteName = body.wasteName || '';
    }

    if (!wasteName && !wasteImageData) {
      return NextResponse.json({ error: 'Waste name or image is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    const thirtyDaysFormatted = thirtyDaysLater.toISOString().split('T')[0];

    const structuredPrompt = `
As a waste management expert, analyze the waste item "${wasteName}" and determine the most appropriate disposal date based on environmental guidelines.

Today's date is ${todayFormatted}.

Reply ONLY with a valid ISO 8601 date string (YYYY-MM-DD).

The date MUST be between ${todayFormatted} and ${thirtyDaysFormatted}.

Examples:
- Hazardous waste: 15-30 days
- Recyclables: within 7 days
- Organic waste: within 3 days
- E-waste: 10-20 days

Return ONLY the date.
`;

    const requestBody = {
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are an environmental waste disposal expert."
        },
        {
          role: "user",
          content: structuredPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 50
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    let aiResponse = response.data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json({ error: 'No response received from AI service' }, { status: 500 });
    }

    aiResponse = aiResponse.trim();

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(aiResponse)) {
      const dateMatch = aiResponse.match(/\d{4}-\d{2}-\d{2}/);

      if (dateMatch) {
        aiResponse = dateMatch[0];
      } else {
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() + 7);
        aiResponse = fallbackDate.toISOString().split('T')[0];
      }
    }

    const responseDate = new Date(aiResponse);

    if (responseDate <= today) {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      aiResponse = tomorrow.toISOString().split('T')[0];
    }

    if (responseDate > thirtyDaysLater) {
      aiResponse = thirtyDaysFormatted;
    }

    if (wasteImageData) {
      try {
        await fs.unlink(wasteImageData.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    return NextResponse.json({
      disposalDate: aiResponse
    });

  } catch (error) {
    console.error('Error in waste disposal date service:', error);
    return NextResponse.json({ error: 'Service error' }, { status: 500 });
  }
}