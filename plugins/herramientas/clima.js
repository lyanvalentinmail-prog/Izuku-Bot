import axios from 'axios'
export default {
  command: ['clima', 'tiempo', 'weather'],
  category: 'herramientas',
  desc: 'Consulta el clima de una ciudad',
  async run({ m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🌤️ Uso: *${usedPrefix}${command} Ciudad de México*`)
    const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(text)}?format=j1&lang=es`, { timeout: 30000 })
    const c = data.current_condition[0]
    const a = data.nearest_area[0]
    await m.reply(
`🌤️ *CLIMA EN ${a.areaName[0].value.toUpperCase()}, ${a.country[0].value}*

🌡️ Temperatura: *${c.temp_C}°C* (sensación ${c.FeelsLikeC}°C)
☁️ Estado: ${c.lang_es?.[0]?.value || c.weatherDesc[0].value}
💧 Humedad: ${c.humidity}%
💨 Viento: ${c.windspeedKmph} km/h
👁️ Visibilidad: ${c.visibility} km
🔆 UV: ${c.uvIndex}`)
  }
}
