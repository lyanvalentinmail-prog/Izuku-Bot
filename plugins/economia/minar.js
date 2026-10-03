import { ITEMS, roll } from '../../lib/shop.js'
import { formatTime, randomInt } from '../../lib/functions.js'

export default {
  command: ['minar', 'mine'],
  category: 'economia',
  desc: 'Mina minerales (necesitas un pico)',
  register: true,
  async run({ m, user, usedPrefix }) {
    if (!user.inventory?.pico) return m.reply(`⛏️ Necesitas un *Pico* para minar.\nCómpralo con *${usedPrefix}comprar pico*`)

    user.lastMine = user.lastMine || 0
    const wait = 300000 - (Date.now() - user.lastMine)
    if (wait > 0) return m.reply(`😮‍💨 Estás agotado. Vuelve a minar en *${formatTime(wait)}*.`)
    user.lastMine = Date.now()

    const key = roll({ carbon: 50, hierro: 30, oro: 15, diamante: 5 })
    const cant = randomInt(1, 3)
    user.inventory[key] = (user.inventory[key] || 0) + cant
    const i = ITEMS[key]

    // El pico se puede romper
    let extra = ''
    if (Math.random() < 0.08) {
      delete user.inventory.pico
      extra = '\n\n💥 ¡Tu pico se rompió! Compra otro.'
    }

    await m.reply(`⛏️ *MINERÍA*\n\nEncontraste ${i.emoji} *${i.name}* x${cant}\n💵 Valor: *${i.sell * cant}* monedas\n🎒 Guardado en tu inventario.${extra}`)
  }
}
