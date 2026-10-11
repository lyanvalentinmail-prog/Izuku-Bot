export default {
  command: ['calc', 'calcular'],
  category: 'herramientas',
  desc: 'Calculadora — uso: calc 5*(3+2)',
  async run({ m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🧮 Uso: *${usedPrefix}${command} 5*(3+2)*`)
    const clean = text.replace(/x/gi, '*').replace(/÷/g, '/').replace(/,/g, '.')
    if (!/^[0-9+\-*/().%\s^]+$/.test(clean)) return m.reply('⚠️ Solo se permiten números y operadores (+ - * / % ^).')
    try {
      const result = Function(`"use strict"; return (${clean.replace(/\^/g, '**')})`)()
      await m.reply(`🧮 *CALCULADORA*\n\n${text} = *${result}*`)
    } catch {
      await m.reply('❌ Operación inválida.')
    }
  }
}
