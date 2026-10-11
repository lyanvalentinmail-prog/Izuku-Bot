import { askAI } from '../../lib/ai.js'
export default {
  command: ['codigo', 'code', 'programar'],
  category: 'ia',
  desc: 'Genera o explica código de programación',
  async run({ m, text, usedPrefix, command }) {
    if (!text) return m.reply(`💻 Uso: *${usedPrefix}${command} función en python que ordene una lista*`)
    await m.react('💻')
    const out = await askAI(text, 'Eres un programador experto. Responde con el código y una explicación corta en español.')
    await m.reply(out)
  }
}
