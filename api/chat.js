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

  // 1. Remove markdown code fence blocks if present
  text = text.replace(/^```html\s*/gi, '').replace(/^```\s*/gi, '').replace(/\s*```$/gi, '');

  // 2. If Gemini included self-check bullets or scratchpad text, isolate the actual HTML
  if (text.includes('`<strong>') || text.includes('<strong>')) {
    // Extract everything from the last occurrence of <strong> or `<strong>
    const lastBacktickCode = text.lastIndexOf('`<strong>');
    if (lastBacktickCode !== -1) {
      text = text.substring(lastBacktickCode).replace(/`/g, '');
    }
  }

  // 3. Remove lingering evaluation checklists like "* Direct answer first? Yes."
  text = text.split('\n')
    .filter(line => !line.trim().startsWith('*   Direct answer') &&
                    !line.trim().startsWith('*   ChatGPT') &&
                    !line.trim().startsWith('*   App builder') &&
                    !line.trim().startsWith('*   Only HTML') &&
                    !line.trim().startsWith('*   Emojis included'))
    .join('\n');

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
Provide a direct, friendly, and helpful response formatted ONLY in clean HTML (<p>, <strong>, <br>, <em>) with relevant emojis.
- If asked about ChatGPT founder: Answer OpenAI (Sam Altman, Greg Brockman, Elon Musk, Ilya Sutskever, etc.).
- If asked about this app: Answer "Entropy Reclaimers was designed & developed by Shehroz to help students reduce digital addiction and reclaim focus."
Do NOT output any markdown, code blocks, or internal thinking steps.`;

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
