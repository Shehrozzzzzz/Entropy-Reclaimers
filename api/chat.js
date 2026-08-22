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

function cleanResponseText(rawText) {
  if (!rawText) return '';
  let text = rawText;

  // If Gemini output contains thinking blocks, grab paragraph tags or content after Draft
  if (text.includes('Draft')) {
    const draftParts = text.split(/Draft\s*\d*:/i);
    text = draftParts[draftParts.length - 1];
  }

  // Strip evaluation checklist bullets
  text = text.replace(/\*\s*(Direct|ChatGPT|App|HTML|Emojis|Tone|Role|Goal|Question|Draft).*/gi, '');

  // Extract pure HTML if <p> or <strong> tags are present
  const firstHtmlTag = text.search(/<(p|strong|div|span|em)>/i);
  if (firstHtmlTag !== -1) {
    text = text.substring(firstHtmlTag);
  }

  return text.trim();
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
        reason: 'No API key configured. Using intelligent local rule engine.'
      });
    }

    const systemPrompt = `You are RECO AI, an intelligent digital wellbeing assistant for the Entropy Reclaimers app (created by Shehroz).
Directives:
1. Provide a direct, friendly, and helpful response.
2. If asked about ChatGPT founder: Answer OpenAI (Sam Altman, Greg Brockman, Elon Musk, Ilya Sutskever, etc.).
3. If asked about this app: Answer "Entropy Reclaimers was designed & developed by Shehroz to help students reduce digital addiction and reclaim focus."
4. Respond ONLY with HTML paragraphs (<p>...</p>) and bold tags (<strong>...</strong>) with emojis. Do not output planning thoughts or checklists.`;

    const userPayload = `Child Context Data: ${JSON.stringify(analytics || {})}\nUser Prompt: "${prompt}"`;

    let candidateModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (listRes.ok) {
        const listData = await listRes.json();
        const validModels = (listData.models || [])
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace(/^models\//, ''));
        if (validModels.length > 0) {
          candidateModels = validModels;
        }
      }
    } catch (e) {
      console.warn('Model auto-discovery failed:', e);
    }

    let reply = '';
    let lastError = null;

    for (const model of candidateModels) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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

        if (apiRes.ok) {
          const data = await apiRes.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          reply = cleanResponseText(raw);
          if (reply) break;
        } else {
          lastError = await apiRes.text();
        }
      } catch (e) {
        lastError = e.message;
      }
    }

    if (!reply) {
      return res.status(200).json({
        fallback: true,
        reason: 'AI service model response empty.',
        error: lastError
      });
    }

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
