import { getJson } from '../../lib/functions.js'
export default {
  command: ['ip', 'ipinfo'],
  category: 'tecnico',
  desc: 'Información de una IP o dominio',
  async run({ m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🌐 Uso: *${usedPrefix}${command} 8.8.8.8* o *${usedPrefix}${command} github.com*`)
    const d = await getJson(`http://ip-api.com/json/${encodeURIComponent(text)}?lang=es`)
    if (d.status !== 'success') return m.reply(`❌ ${d.message || 'No pude consultar esa dirección.'}`)
    await m.reply(
`🌐 *INFORMACIÓN DE RED*

🔢 IP: *${d.query}*
🏳️ País: *${d.country}* (${d.countryCode})
🏙️ Región: ${d.regionName}, ${d.city}
📮 Código postal: ${d.zip || '—'}
🕒 Zona horaria: ${d.timezone}
🏢 Proveedor: ${d.isp}
🏭 Organización: ${d.org || '—'}
📍 Coordenadas: ${d.lat}, ${d.lon}`)
  }
}
