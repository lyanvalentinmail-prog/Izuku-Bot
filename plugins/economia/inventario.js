import { ITEMS } from '../../lib/shop.js'
export default {
  command: ['inventario', 'inv', 'mochila'],
  category: 'economia',
  desc: 'Muestra tu inventario',
  async run({ m, user, usedPrefix }) {
    const entradas = Object.entries(user.inventory || {}).filter(([, n]) => n > 0)
    if (!entradas.length) return m.reply(`🎒 Tu mochila está vacía.\nCompra algo con *${usedPrefix}tienda*`)

    let valor = 0
    let txt = `🎒 *TU INVENTARIO*\n`
    for (const [key, n] of entradas) {
      const i = ITEMS[key]
      if (!i) continue
      valor += i.sell * n
      txt += `\n${i.emoji} *${i.name}* x${n}  _(${i.sell * n} 🪙)_`
    }
    txt += `\n\n💰 Valor total: *${valor}* monedas\n💡 Vende con *${usedPrefix}vender <objeto> all*`
    await m.reply(txt)
  }
}
