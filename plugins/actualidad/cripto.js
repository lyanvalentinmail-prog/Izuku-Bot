import { getJson } from '../../lib/functions.js'
import { apiCache } from '../../lib/cache.js'

const ALIAS = { btc:'bitcoin', eth:'ethereum', bnb:'binancecoin', sol:'solana', ada:'cardano', xrp:'ripple', doge:'dogecoin', usdt:'tether', ltc:'litecoin', dot:'polkadot', matic:'matic-network', shib:'shiba-inu' }

export default {
  command: ['cripto', 'crypto', 'btc'],
  category: 'actualidad',
  desc: 'Precio de criptomonedas en vivo',
  async run({ m, args, usedPrefix, command }) {
    await m.react('📈')
    const q = (args[0] || '').toLowerCase()

    // Sin argumentos: top del mercado
    if (!q) {
      let top = apiCache.get('cripto:top')
      if (!top) {
        top = await getJson('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=8&page=1')
        apiCache.set('cripto:top', top, 300)
      }
      let txt = '📈 *TOP CRIPTOMONEDAS*\n'
      top.forEach((c, i) => {
        const f = c.price_change_percentage_24h || 0
        txt += `\n${i + 1}. *${c.symbol.toUpperCase()}* — $${c.current_price.toLocaleString('es')}\n    ${f >= 0 ? '🟢 +' : '🔴 '}${f.toFixed(2)}% (24h)`
      })
      return m.reply(`${txt}\n\n💡 Detalle: *${usedPrefix}${command} btc*`)
    }

    const id = ALIAS[q] || q
    const d = await getJson(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`).catch(() => null)
    if (!d?.market_data) return m.reply(`❌ No encontré *${q}*.\nPrueba: ${Object.keys(ALIAS).join(', ')}`)

    const md = d.market_data
    const cambio = (n) => `${n >= 0 ? '🟢 +' : '🔴 '}${(n || 0).toFixed(2)}%`

    await m.reply(
`📈 *${d.name.toUpperCase()} (${d.symbol.toUpperCase()})*

💵 Precio: *$${md.current_price.usd.toLocaleString('es')}*
🇪🇺 En euros: €${md.current_price.eur?.toLocaleString('es')}

📊 *Variación:*
   1h:  ${cambio(md.price_change_percentage_1h_in_currency?.usd)}
   24h: ${cambio(md.price_change_percentage_24h)}
   7d:  ${cambio(md.price_change_percentage_7d)}
   30d: ${cambio(md.price_change_percentage_30d)}

🏆 Ranking: *#${d.market_cap_rank}*
💰 Capitalización: $${(md.market_cap.usd / 1e9).toFixed(2)} B
📉 Mínimo 24h: $${md.low_24h.usd.toLocaleString('es')}
📈 Máximo 24h: $${md.high_24h.usd.toLocaleString('es')}`)
  }
}
