import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const product = formData.get('product');
    const imageFile = formData.get('image');

    if (!product && !imageFile) {
      return NextResponse.json({ error: 'Product name or image is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const structuredPrompt = `
As an environmental waste classification expert, provide a detailed analysis for ${product ? `"${product}"` : 'the item described'}.

Reply STRICTLY in this format:

**Waste Type Classification:**
* **Degradable:** [Yes/No] - [concise explanation with scientific basis]
* **Biodegradable:** [Yes/No] - [concise explanation with scientific basis]
* **Non-degradable:** [Yes/No] - [concise explanation with scientific basis]

**Storage and Disposal Instructions:**
* **Storage:** [bullet points with specific storage guidelines]
* **Disposal:** [bullet points with proper disposal methods according to environmental regulations]
* **Possible Recycling Methods:** [bullet points with available recycling options and processes]
* **Resale Value:** [estimate of potential circular economy value or statement of no resale value]

Base all classifications on material composition, environmental impact, and current waste management best practices.
`;

    const requestBody = {
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are an environmental waste classification expert."
        },
        {
          role: "user",
          content: structuredPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    let aiResponse = response.data?.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json({ error: 'No response received from classification service' }, { status: 500 });
    }

    // Validate format
    const hasWasteTypes = aiResponse.includes("**Waste Type Classification:**");
    const hasDisposalInstructions = aiResponse.includes("**Storage and Disposal Instructions:**");

    if (!hasWasteTypes || !hasDisposalInstructions) {

      const retryBody = {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are an environmental waste classification expert."
          },
          {
            role: "user",
            content: `
${structuredPrompt}

IMPORTANT: You MUST follow the EXACT format specified.
`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      };

      const retryResponse = await axios.post(url, retryBody, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });

      aiResponse = retryResponse.data?.choices?.[0]?.message?.content ?? aiResponse;
    }

    let enhancedResponse = aiResponse;

    if (product) {
      enhancedResponse = `**Item Analyzed:** ${product}\n\n${aiResponse}`;
    }

    return NextResponse.json({
      result: enhancedResponse,
      timestamp: new Date().toISOString(),
      source: 'Environmental Classification System v1.2'
    });

  } catch (error) {
    console.error('Error in waste classification service:', error);

    const errorMessage =
      error.response?.data?.error?.message ||
      error.message ||
      'Unknown error';

    const statusCode = error.response?.status || 500;

    return NextResponse.json(
      {
        error: 'Classification service error',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}