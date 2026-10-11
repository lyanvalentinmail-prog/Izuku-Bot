import { getJson } from '../../lib/functions.js'
export default {
  command: ['hora', 'horamundial', 'time'],
  category: 'internacional',
  desc: 'Hora actual en cualquier ciudad',
  async run({ m, text, usedPrefix, command }) {
    if (!text) {
      const zonas = [['🇺🇾 Montevideo', 'America/Montevideo'], ['🇲🇽 Ciudad de México', 'America/Mexico_City'], ['🇪🇸 Madrid', 'Europe/Madrid'], ['🇦🇷 Buenos Aires', 'America/Argentina/Buenos_Aires'], ['🇨🇴 Bogotá', 'America/Bogota'], ['🇯🇵 Tokio', 'Asia/Tokyo']]
      const lista = zonas.map(([n, tz]) =>
        `${n}: *${new Date().toLocaleTimeString('es', { timeZone: tz, hour: '2-digit', minute: '2-digit' })}*`).join('\n')
      return m.reply(`🕒 *HORA MUNDIAL*\n\n${lista}\n\n💡 *${usedPrefix}${command} Tokio* para una ciudad concreta`)
    }
    const d = await getJson(`https://wttr.in/${encodeURIComponent(text)}?format=j1`).catch(() => null)
    const zona = d?.nearest_area?.[0]
    if (!zona) return m.reply('❌ No encontré esa ciudad.')
    const local = d.time_zone?.[0]
    await m.reply(
`🕒 *${zona.areaName[0].value.toUpperCase()}, ${zona.country[0].value}*

⏰ Hora local: *${local?.localtime?.split(' ')[1] || '—'}*
📅 Fecha: *${local?.localtime?.split(' ')[0] || '—'}*
🌅 Amanecer: ${d.weather?.[0]?.astronomy?.[0]?.sunrise || '—'}
🌇 Atardecer: ${d.weather?.[0]?.astronomy?.[0]?.sunset || '—'}`)
  }
}
