// Vercel Serverless Function: RECO AI Chatbot API Endpoint
// Supports Google Gemini API key via process.env.GEMINI_API_KEY or user-provided key

function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      return resolve(req.body);
    }
    if (typeof req.body === 'string') {
      try { return resolve(JSON.parse(req.body)); } catch (e) {}
    }
    let data = '';
    req.on('data', (chunk) => { data += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const body = await parseBody(req);
    const prompt = body.prompt || req.query?.prompt || 'Hello';
    const analytics = body.analytics || {};
    const apiKey = body.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        fallback: true,
        reason: 'No API key configured. Using intelligent local rule engine.',
        debug: {
          hasEnvGeminiKey: !!process.env.GEMINI_API_KEY,
          hasEnvOpenAIKey: !!process.env.OPENAI_API_KEY,
          receivedPrompt: prompt
        }
      });
    }

    // Call Gemini 1.5 Flash endpoint
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `You are RECO AI, an intelligent digital wellbeing assistant and parental advisor for the Entropy Reclaimers app.
Your mission: Help parents and students reduce screen addiction, optimize focus, and build healthy habits.
Formatting guidelines:
- Return clean HTML output suitable for innerHTML insertion.
- Use <strong>, <br>, <em>, <span> tags.
- Use CSS classes for key stats: class="chat-accent" (green/healthy), class="chat-danger" (red/over limit), class="chat-gold" (warning/gaming).
- Keep responses concise (under 200 words), encouraging, and structured with bullet points or numbered lists where appropriate.
- Include relevant emojis.`;

    const userPayload = `Child/Student Context Data:
${JSON.stringify(analytics || {}, null, 2)}

User Question/Prompt:
"${prompt}"`;

    const apiRes = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPayload}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      })
    });

    if (!apiRes.ok) {
      const errDetail = await apiRes.text();
      console.error('Gemini API request failed:', errDetail);
      return res.status(200).json({
        fallback: true,
        reason: 'AI service unavailable or key limit reached.',
        error: errDetail
      });
    }

    const data = await apiRes.json();
    let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip markdown code blocks if the AI returned ```html ... ```
    reply = reply.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    return res.status(200).json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error('Serverless function exception:', error);
    return res.status(200).json({
      fallback: true,
      reason: 'Serverless exception',
      error: error.message
    });
  }
};
