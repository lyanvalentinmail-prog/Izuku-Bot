import { findItem } from '../../lib/shop.js'
export default {
  command: ['vender', 'sell'],
  category: 'economia',
  desc: 'Vende objetos de tu inventario',
  register: true,
  async run({ m, args, user, usedPrefix, command }) {
    const item = findItem(args[0])
    if (!item) return m.reply(`💱 Uso: *${usedPrefix}${command} diamante 2*\nO *${usedPrefix}${command} <objeto> all*`)
    const tengo = user.inventory[item.key] || 0
    if (!tengo) return m.reply(`🎒 No tienes ningún *${item.name}*.`)

    const cant = args[1] === 'all' ? tengo : Math.max(1, parseInt(args[1]) || 1)
    if (cant > tengo) return m.reply(`⚠️ Solo tienes *${tengo}* ${item.name}.`)

    const total = item.sell * cant
    user.inventory[item.key] -= cant
    if (user.inventory[item.key] <= 0) delete user.inventory[item.key]
    user.coins += total
    await m.reply(`💱 *VENTA REALIZADA*\n\n${item.emoji} ${item.name} x${cant}\n💵 Recibiste: *${total}* monedas\n💰 Saldo: *${user.coins}*`)
  }
}
