import { askAI } from '../../lib/ai.js'
export default {
  command: ['ia', 'chatgpt', 'gpt', 'izuku'],
  category: 'ia',
  desc: 'Conversa con la inteligencia artificial',
  async run({ m, text, usedPrefix, command }) {
    const q = text || m.quoted?.text
    if (!q) return m.reply(`🧠 Uso: *${usedPrefix}${command} tu pregunta*\n\nEjemplo: *${usedPrefix}${command} explícame qué es la fotosíntesis*`)
    await m.react('🧠')
    const answer = await askAI(q)
    await m.reply(`🧠 *IZUKU IA*\n\n${answer}`)
    await m.react('✅')
  }
}
