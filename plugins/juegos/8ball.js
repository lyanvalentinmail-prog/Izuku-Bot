import { random } from '../../lib/functions.js'
export default {
  command: ['8ball', 'bola8'],
  category: 'juegos',
  desc: 'La bola mágica responde tus preguntas',
  async run({ m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🎱 Uso: *${usedPrefix}${command} ¿Aprobaré el examen?*`)
    const r = ['Sí, definitivamente.', 'No cuentes con ello.', 'Es cierto.', 'Mi respuesta es no.', 'Pregunta más tarde.', 'Sin duda.', 'Muy dudoso.', 'Sí.', 'No puedo predecirlo ahora.', 'Las señales apuntan a que sí.']
    await m.reply(`🎱 *BOLA MÁGICA*\n\n❓ ${text}\n💬 *${random(r)}*`)
  }
}
