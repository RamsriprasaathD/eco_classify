import { NextResponse } from 'next/server';
import axios from 'axios';
import { parse } from 'papaparse';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export async function POST(req) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    let formData;
    try {
      formData = await req.formData();
    } catch (formError) {
      console.error('Error parsing form data:', formError);
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400, headers });
    }

    const csvFile = formData.get('csvFile');
    const email = formData.get('email');

    if (!csvFile || !(csvFile instanceof Blob)) {
      return NextResponse.json({ error: 'CSV file is required' }, { status: 400, headers });
    }

    if (!email) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400, headers });
    }

    let csvText;
    try {
      csvText = await csvFile.text();
    } catch (textError) {
      console.error('Error reading CSV:', textError);
      return NextResponse.json({ error: 'Could not read CSV file content' }, { status: 400, headers });
    }

    let parsedData;
    try {
      parsedData = parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });
    } catch (parseError) {
      console.error('CSV parse error:', parseError);
      return NextResponse.json({ error: 'Invalid CSV format' }, { status: 400, headers });
    }

    if (!parsedData.data || parsedData.data.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400, headers });
    }

    const firstRow = parsedData.data[0];
    const headers_csv = Object.keys(firstRow);

    const wasteNameColumn = headers_csv.find(header =>
      header.toLowerCase() === 'waste_name' ||
      header.toLowerCase() === 'wastename' ||
      header.toLowerCase() === 'waste name' ||
      header.toLowerCase() === 'name'
    );

    if (!wasteNameColumn) {
      return NextResponse.json({
        error: 'CSV must contain a column for waste name (e.g., "waste_name")'
      }, { status: 400, headers });
    }

    const results = [];
    const apiKey = process.env.GROQ_API_KEY;
    const url = "https://api.groq.com/openai/v1/chat/completions";

    for (const row of parsedData.data) {

      const wasteName = row[wasteNameColumn]?.trim();

      if (!wasteName) {
        results.push({
          wasteName: '(empty)',
          error: 'Empty waste name'
        });
        continue;
      }

      try {

        const today = new Date();
        const todayFormatted = today.toISOString().split('T')[0];

        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(today.getDate() + 30);
        const thirtyDaysFormatted = thirtyDaysLater.toISOString().split('T')[0];

        const randomDays = Math.floor(Math.random() * 30) + 1;
        const fallbackDate = new Date();
        fallbackDate.setDate(today.getDate() + randomDays);
        let disposalDate = fallbackDate.toISOString().split('T')[0];

        if (apiKey) {
          try {

            const structuredPrompt = `
As a waste management expert, analyze the waste item "${wasteName}" and determine the most appropriate disposal date.

Today's date is ${todayFormatted}.

Return ONLY a valid ISO date (YYYY-MM-DD).

The date MUST be between ${todayFormatted} and ${thirtyDaysFormatted}.
`;

            const requestBody = {
              model: "llama-3.1-8b-instant",
              messages: [
                {
                  role: "system",
                  content: "You are a waste management expert."
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
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
              },
              timeout: 5000
            });

            const aiResponse = response.data?.choices?.[0]?.message?.content?.trim();

            if (aiResponse) {
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

              if (dateRegex.test(aiResponse)) {

                const responseDate = new Date(aiResponse);

                if (!isNaN(responseDate.getTime()) &&
                    responseDate > today &&
                    responseDate <= thirtyDaysLater) {

                  disposalDate = aiResponse;
                }
              }
            }

          } catch (aiError) {
            console.error(`Groq AI error for "${wasteName}"`, aiError.message);
          }
        }

        results.push({
          wasteName,
          disposalDate
        });

      } catch (itemError) {

        console.error(`Error processing "${wasteName}"`, itemError);

        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() + 7);

        results.push({
          wasteName,
          disposalDate: fallbackDate.toISOString().split('T')[0]
        });

      }

    }

    return NextResponse.json({
      results,
      success: results.filter(item => !item.error).length,
      errors: results.filter(item => item.error).length
    }, { headers });

  } catch (error) {

    console.error('Bulk processing error:', error);

    return NextResponse.json({
      error: 'Bulk processing service error',
      message: error.message
    }, { status: 500 });

  }
}