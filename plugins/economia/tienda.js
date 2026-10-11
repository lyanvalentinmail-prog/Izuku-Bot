import { BUYABLE, ITEMS } from '../../lib/shop.js'
export default {
  command: ['tienda', 'shop'],
  category: 'economia',
  desc: 'Muestra los objetos a la venta',
  async run({ m, usedPrefix, user }) {
    let txt = `🛒 *TIENDA DE ${'IZUKU'}*\n💰 Tu saldo: *${user.coins}* monedas\n`
    txt += '\n╭──「 EN VENTA 」'
    for (const [key, i] of BUYABLE) {
      txt += `\n│ ${i.emoji} *${i.name}* — ${i.price} 🪙\n│    _${i.desc}_\n│    \`${usedPrefix}comprar ${key}\``
    }
    txt += '\n╰────────────────\n'
    txt += '\n╭──「 SE COMPRAN 」'
    for (const [key, i] of Object.entries(ITEMS).filter(([, i]) => !i.price)) {
      txt += `\n│ ${i.emoji} ${i.name} — se vende por ${i.sell} 🪙`
    }
    txt += `\n╰────────────────\n\n💡 Vende con *${usedPrefix}vender <objeto> [cantidad]*`
    await m.reply(txt)
  }
}
