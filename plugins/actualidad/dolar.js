import { getJson } from '../../lib/functions.js'
import { apiCache } from '../../lib/cache.js'

const PAISES = [
  ['UYU', '🇺🇾 Peso uruguayo'],
  ['ARS', '🇦🇷 Peso argentino'],
  ['MXN', '🇲🇽 Peso mexicano'],
  ['COP', '🇨🇴 Peso colombiano'],
  ['CLP', '🇨🇱 Peso chileno'],
  ['PEN', '🇵🇪 Sol peruano'],
  ['BRL', '🇧🇷 Real brasileño'],
  ['EUR', '🇪🇺 Euro'],
  ['VES', '🇻🇪 Bolívar']
]

export default {
  command: ['dolar', 'dólar'],
  category: 'actualidad',
  desc: 'Cotización del dólar en Latinoamérica',
  async run({ m, usedPrefix }) {
    await m.react('💵')
    let d = apiCache.get('dolar')
    if (!d) {
      d = await getJson('https://open.er-api.com/v6/latest/USD').catch(() => null)
      if (d?.rates) apiCache.set('dolar', d, 1800)
    }
    if (!d?.rates) return m.reply('❌ No pude obtener las cotizaciones ahora mismo.')

    let txt = '💵 *COTIZACIÓN DEL DÓLAR*\n_1 USD equivale a:_\n'
    for (const [cod, nombre] of PAISES) {
      const t = d.rates[cod]
      if (t) txt += `\n${nombre}\n   *${t.toLocaleString('es', { maximumFractionDigits: 2 })}* ${cod}`
    }
    txt += `\n\n🕒 ${d.time_last_update_utc?.slice(5, 16) || '—'}`
    txt += `\n💡 Convierte cantidades con *${usedPrefix}divisa 100 usd uyu*`
    await m.reply(txt)
  }
}
