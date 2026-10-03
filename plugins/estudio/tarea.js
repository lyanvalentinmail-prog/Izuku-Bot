import { askAI } from '../../lib/ai.js'
export default {
  command: ['tarea', 'estudiar', 'explicame'],
  category: 'estudio',
  desc: 'Resuelve y explica una tarea paso a paso',
  async run({ m, text, usedPrefix, command }) {
    const q = text || m.quoted?.text
    if (!q) return m.reply(`📚 Uso: *${usedPrefix}${command} ¿por qué llueve?*`)
    await m.react('📚')
    const out = await askAI(q,
      'Eres un profesor paciente. Responde en español, con lenguaje claro para un estudiante. ' +
      'Estructura: 1) Respuesta corta, 2) Explicación paso a paso, 3) Un ejemplo. Usa viñetas.')
    await m.reply(`📚 *AYUDA CON LA TAREA*\n\n${out}`)
  }
}
