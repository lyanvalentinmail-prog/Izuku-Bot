import { askAI } from '../../lib/ai.js'
export default {
  command: ['resolver', 'ecuacion'],
  category: 'estudio',
  desc: 'Resuelve una ecuación paso a paso',
  async run({ m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🧮 Uso: *${usedPrefix}${command} 2x + 5 = 15*`)
    await m.react('🧮')
    const out = await askAI(text, 'Resuelve el problema matemático paso a paso en español. Muestra cada paso numerado y al final la respuesta en negrita.')
    await m.reply(`🧮 *SOLUCIÓN*\n\n${out}`)
  }
}
