import { getJson } from '../../lib/functions.js'
export default {
  command: ['divisa', 'moneda', 'convertir', 'cambio'],
  category: 'internacional',
  desc: 'Convierte monedas — divisa 100 usd uyu',
  async run({ m, args, usedPrefix, command }) {
    const [cant, de, a] = args
    if (!cant || !de || !a) return m.reply(`💱 Uso: *${usedPrefix}${command} 100 usd uyu*\n\nEj: usd, eur, mxn, ars, cop, uyu, brl, clp`)
    const monto = parseFloat(cant.replace(',', '.'))
    if (isNaN(monto)) return m.reply('⚠️ La cantidad no es un número válido.')

    const d = await getJson(`https://open.er-api.com/v6/latest/${de.toUpperCase()}`).catch(() => null)
    const tasa = d?.rates?.[a.toUpperCase()]
    if (!tasa) return m.reply('❌ No reconozco alguna de esas monedas.')

    const total = monto * tasa
    await m.reply(
`💱 *CONVERSIÓN DE MONEDA*

${monto.toLocaleString('es')} *${de.toUpperCase()}*
          ⬇️
${total.toLocaleString('es', { maximumFractionDigits: 2 })} *${a.toUpperCase()}*

📈 1 ${de.toUpperCase()} = ${tasa} ${a.toUpperCase()}
🕒 Actualizado: ${d.time_last_update_utc?.slice(5, 16) || '—'}`)
  }
}
