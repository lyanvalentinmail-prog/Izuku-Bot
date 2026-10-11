import { askAI } from '../../lib/ai.js'
export default {
  command: ['sinonimos', 'antonimos'],
  category: 'estudio',
  desc: 'Sinónimos o antónimos de una palabra',
  async run({ m, text, command, usedPrefix }) {
    if (!text) return m.reply(`🔤 Uso: *${usedPrefix}${command} feliz*`)
    await m.react('🔤')
    const out = await askAI(text, `Da una lista de 10 ${command} en español de la palabra indicada. Responde solo la lista numerada, sin explicaciones.`)
    await m.reply(`🔤 *${command.toUpperCase()} DE "${text}"*\n\n${out}`)
  }
}
