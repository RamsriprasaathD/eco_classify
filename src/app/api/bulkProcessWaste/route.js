import { NextResponse } from 'next/server';
import getDisposalDate from '../../../lib/groqDate';
import { parse } from 'papaparse';
import prisma from '../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth';

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

    // auth: ensure the request comes from an authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }
    if (session.user.email !== email) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 401, headers });
    }

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
        // compute disposal date via shared helper
        let disposalDate = null;
        try {
          disposalDate = await getDisposalDate(wasteName);
        } catch (helperErr) {
          console.error('getDisposalDate error for', wasteName, helperErr);
        }

        if (!disposalDate) {
          const randomDays = Math.floor(Math.random() * 30) + 1;
          const fallbackDate = new Date();
          fallbackDate.setDate(new Date().getDate() + randomDays);
          disposalDate = fallbackDate.toISOString().split('T')[0];
        }

        // persist event to DB for the logged-in user
        try {
          const created = await prisma.event.create({
            data: {
              title: wasteName,
              date: new Date(disposalDate),
              email: session.user.email,
            },
          });

          results.push({
            wasteName,
            disposalDate,
            eventId: created.id,
          });
        } catch (dbErr) {
          console.error('Error creating event for', wasteName, dbErr);
          results.push({ wasteName, disposalDate, error: 'Failed to save event' });
        }

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
