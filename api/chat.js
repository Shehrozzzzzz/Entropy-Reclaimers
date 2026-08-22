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

function extractFinalHTML(rawText) {
  if (!rawText) return '';
  let text = rawText;

  // Strip code blocks
  text = text.replace(/^```html\s*/gi, '').replace(/^```\s*/gi, '').replace(/\s*```$/gi, '');

  // Isolate text starting from the actual HTML response tag (<p>, <strong>, etc.)
  const pIndex = text.search(/<p>/i);
  if (pIndex !== -1) {
    text = text.substring(pIndex);
  } else {
    const tagIndex = text.search(/<(strong|div|span|em)>/i);
    if (tagIndex !== -1) {
      text = text.substring(tagIndex);
    }
  }

  // Remove trailing thinking bullets if any exist after the response
  const lines = text.split('\n').filter(line => {
    const l = line.trim();
    if (l.startsWith('*   Direct') || l.startsWith('*   Clear') || l.startsWith('*   Clean')) return false;
    return true;
  });

  return lines.join('\n').replace(/`/g, '').trim();
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
    const apiKey = body.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        fallback: true,
        reason: 'No API key configured. Using intelligent local rule engine.'
      });
    }

    const systemInstructionText = `You are RECO AI, a friendly assistant for Entropy Reclaimers app.
Knowledge Facts:
- Entropy Reclaimers was designed & developed by Shehroz to help students reduce digital addiction and reclaim focus.
- ChatGPT was created by OpenAI (co-founded by Sam Altman, Greg Brockman, Elon Musk, Ilya Sutskever, Wojciech Zaremba, John Schulman).
Always format response inside <p>...</p> HTML tags with <strong> and emojis. Do not output planning thoughts.`;

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
            system_instruction: {
              parts: [{ text: systemInstructionText }]
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 300
            }
          })
        });

        if (apiRes.ok) {
          const data = await apiRes.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          reply = extractFinalHTML(raw);
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
