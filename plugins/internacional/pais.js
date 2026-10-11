import { getJson } from '../../lib/functions.js'
export default {
  command: ['pais', 'country'],
  category: 'internacional',
  desc: 'Datos de un país',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🌍 Uso: *${usedPrefix}${command} Uruguay*`)
    await m.react('🌍')
    const d = (await getJson(`https://restcountries.com/v3.1/name/${encodeURIComponent(text)}?fields=name,capital,population,area,region,languages,currencies,flags,timezones,maps`))?.[0]
    if (!d) return m.reply('❌ No encontré ese país.')
    const caption =
`🌍 *${d.name.common.toUpperCase()}*

🏛️ Capital: *${d.capital?.[0] || '—'}*
🗺️ Región: *${d.region}*
👥 Población: *${d.population.toLocaleString('es')}*
📐 Superficie: *${d.area?.toLocaleString('es')} km²*
🗣️ Idiomas: ${Object.values(d.languages || {}).join(', ')}
💰 Moneda: ${Object.values(d.currencies || {}).map((c) => `${c.name} (${c.symbol || ''})`).join(', ')}
🕒 Zona horaria: ${d.timezones?.[0]}

🗺️ ${d.maps?.googleMaps || ''}`
    try { await sock.sendMessage(m.chat, { image: { url: d.flags.png }, caption }, { quoted: m }) }
    catch { await m.reply(caption) }
  }
}
