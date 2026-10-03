import { getJson } from '../../lib/functions.js'
export default {
  command: ['elemento', 'tablaperiodica'],
  category: 'estudio',
  desc: 'Datos de un elemento químico',
  async run({ m, text, usedPrefix, command }) {
    if (!text) return m.reply(`⚗️ Uso: *${usedPrefix}${command} oxigeno* o *${usedPrefix}${command} Fe*`)
    await m.react('⚗️')
    const data = await getJson('https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json')
    const q = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const e = data.elements.find((el) =>
      el.symbol.toLowerCase() === q || el.name.toLowerCase() === q ||
      el.name.toLowerCase().startsWith(q) || String(el.number) === q)
    if (!e) return m.reply('❌ No encontré ese elemento.')
    await m.reply(
`⚗️ *${e.name.toUpperCase()}* (${e.symbol})

🔢 Número atómico: *${e.number}*
⚖️ Masa atómica: *${e.atomic_mass?.toFixed(3)}*
🧪 Categoría: *${e.category}*
🌡️ Fusión: *${e.melt ? e.melt + ' K' : '—'}* · Ebullición: *${e.boil ? e.boil + ' K' : '—'}*
🧲 Config. electrónica: ${e.electron_configuration_semantic || e.electron_configuration}
👨‍🔬 Descubierto por: ${e.discovered_by || '—'}

📖 ${(e.summary || '').slice(0, 500)}`)
  }
}
