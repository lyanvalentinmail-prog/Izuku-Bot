import { getJson } from '../../lib/functions.js'
export default {
  command: ['letra', 'lyrics'],
  category: 'busqueda',
  desc: 'Busca la letra de una canción — uso: letra artista - canción',
  async run({ m, text, usedPrefix, command }) {
    if (!text.includes('-')) return m.reply(`🎤 Uso: *${usedPrefix}${command} Coldplay - Yellow*`)
    const [artist, song] = text.split('-').map((x) => x.trim())
    await m.react('🎤')
    const data = await getJson(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`)
    if (!data.lyrics) return m.reply('❌ No encontré esa letra.')
    await m.reply(`🎤 *${artist} — ${song}*\n\n${data.lyrics.slice(0, 3500)}`)
  }
}
