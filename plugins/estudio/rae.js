import { getJson } from '../../lib/functions.js'
export default {
  command: ['rae', 'significado', 'diccionario'],
  category: 'estudio',
  desc: 'Significado de una palabra en español',
  async run({ m, text, usedPrefix, command }) {
    if (!text) return m.reply(`📖 Uso: *${usedPrefix}${command} resiliencia*`)
    await m.react('📖')
    const d = await getJson(`https://api.dictionaryapi.dev/api/v2/entries/es/${encodeURIComponent(text.split(' ')[0])}`).catch(() => null)
    if (!Array.isArray(d)) return m.reply(`❌ No encontré *${text}* en el diccionario.`)
    let txt = `📖 *${d[0].word.toUpperCase()}*\n`
    for (const sig of d[0].meanings.slice(0, 4)) {
      txt += `\n🔹 _${sig.partOfSpeech}_`
      for (const def of sig.definitions.slice(0, 2)) txt += `\n   • ${def.definition}`
    }
    await m.reply(txt)
  }
}
