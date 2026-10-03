import { askAI } from '../../lib/ai.js'
export default {
  command: ['explica', 'resumir', 'resumen'],
  category: 'ia',
  desc: 'Resume o explica un texto largo',
  async run({ m, text, usedPrefix, command }) {
    const q = text || m.quoted?.text
    if (!q) return m.reply(`📄 Responde a un texto o escribe: *${usedPrefix}${command} <texto>*`)
    await m.react('📝')
    const out = await askAI(q, 'Resume y explica el siguiente texto en español, de forma clara y con viñetas.')
    await m.reply(`📝 *RESUMEN*\n\n${out}`)
  }
}
