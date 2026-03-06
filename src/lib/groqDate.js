import axios from 'axios';

const DEFAULT_MAX_DAYS = 30;

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

export async function getDisposalDate(wasteName, { maxDays = DEFAULT_MAX_DAYS, apiKey = process.env.GROQ_API_KEY } = {}) {
  const today = new Date();
  const todayFormatted = isoDate(today);

  const maxDate = new Date();
  maxDate.setDate(today.getDate() + maxDays);
  const maxFormatted = isoDate(maxDate);

  // Default fallback (random within range) in case AI fails
  const randomDays = Math.floor(Math.random() * Math.max(1, maxDays)) + 1;
  const fallback = new Date();
  fallback.setDate(today.getDate() + randomDays);
  let disposalDate = isoDate(fallback);

  if (!apiKey) return disposalDate;

  try {
    const structuredPrompt = `
As a waste management expert, analyze the waste item "${wasteName}" and determine the most appropriate disposal date.

Today's date is ${todayFormatted}.

Return ONLY a valid ISO 8601 date string (YYYY-MM-DD).

The date MUST be between ${todayFormatted} and ${maxFormatted}.
`;

    const requestBody = {
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a waste management expert." },
        { role: "user", content: structuredPrompt }
      ],
      temperature: 0.2,
      max_tokens: 50
    };

    const url = "https://api.groq.com/openai/v1/chat/completions";
    const res = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 8000
    });

    let aiResponse = res.data?.choices?.[0]?.message?.content;
    if (!aiResponse) return disposalDate;
    aiResponse = aiResponse.trim();

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(aiResponse)) {
      const match = aiResponse.match(/\d{4}-\d{2}-\d{2}/);
      if (match) aiResponse = match[0];
      else return disposalDate;
    }

    const candidate = new Date(aiResponse);
    if (isNaN(candidate.getTime())) return disposalDate;
    if (candidate <= today) {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      return isoDate(tomorrow);
    }
    if (candidate > maxDate) return isoDate(maxDate);

    return isoDate(candidate);
  } catch (err) {
    console.error('groqDate error:', err?.message || err);
    return disposalDate;
  }
}

export default getDisposalDate;
