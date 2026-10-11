import { askAI } from '../../lib/ai.js'
export default {
  command: ['ortografia', 'corregir'],
  category: 'estudio',
  desc: 'Corrige la ortografía y gramática de un texto',
  async run({ m, text, usedPrefix, command }) {
    const q = text || m.quoted?.text
    if (!q) return m.reply(`✍️ Responde a un texto o escribe: *${usedPrefix}${command} <texto>*`)
    await m.react('✍️')
    const out = await askAI(q, 'Corrige la ortografía, tildes y gramática del texto. Devuelve primero el texto corregido y luego una lista breve de los errores encontrados. En español.')
    await m.reply(`✍️ *CORRECCIÓN*\n\n${out}`)
  }
}
