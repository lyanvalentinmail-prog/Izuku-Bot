import axios from 'axios'
import config from '../config.js'

/**
 * Pregunta a un modelo de IA.
 * 1) Si hay OPENAI_API_KEY en config -> usa OpenAI.
 * 2) Si hay GEMINI_API_KEY -> usa Gemini.
 * 3) Si no, usa endpoints publicos gratuitos (pueden fallar o cambiar).
 */
export async function askAI(prompt, system = 'Eres Izuku, un asistente amable que responde en español de forma breve y clara.') {
  // --- OpenAI ---
  if (config.apis.openai) {
    const { data } = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }]
    }, { headers: { Authorization: `Bearer ${config.apis.openai}` }, timeout: 60000 })
    return data.choices[0].message.content
  }

  // --- Gemini ---
  if (config.apis.gemini) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.apis.gemini}`
    const { data } = await axios.post(url, {
      contents: [{ parts: [{ text: `${system}\n\n${prompt}` }] }]
    }, { timeout: 60000 })
    return data.candidates[0].content.parts[0].text
  }

  // --- Endpoints publicos de respaldo ---
  const fallbacks = [
    async () => {
      const { data } = await axios.get('https://api.dreaded.site/api/chatgpt', { params: { text: prompt }, timeout: 45000 })
      return data?.result?.prompt || data?.result
    },
    async () => {
      const { data } = await axios.get('https://api.siputzx.my.id/api/ai/gpt3', {
        params: { prompt: system, content: prompt }, timeout: 45000
      })
      return data?.data
    },
    async () => {
      const { data } = await axios.post('https://text.pollinations.ai/', {
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        model: 'openai'
      }, { timeout: 45000 })
      return typeof data === 'string' ? data : JSON.stringify(data)
    }
  ]

  for (const fn of fallbacks) {
    try {
      const out = await fn()
      if (out && String(out).trim()) return String(out).trim()
    } catch {}
  }
  throw new Error('Ningún servicio de IA respondió. Configura tu API key en config.js (apis.openai o apis.gemini).')
}
