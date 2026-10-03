import { findItem } from '../../lib/shop.js'
export default {
  command: ['comprar', 'buy'],
  category: 'economia',
  desc: 'Compra un objeto de la tienda',
  register: true,
  async run({ m, args, user, usedPrefix, command }) {
    const item = findItem(args[0])
    const cant = Math.max(1, parseInt(args[1]) || 1)
    if (!item) return m.reply(`🛒 Uso: *${usedPrefix}${command} pico 1*\nMira la lista con *${usedPrefix}tienda*`)
    if (!item.price) return m.reply(`⚠️ *${item.name}* no está a la venta, solo se puede conseguir jugando.`)

    const total = item.price * cant
    if (total > user.coins) return m.reply(`💸 Te faltan *${total - user.coins}* monedas.\nPrecio: ${total} 🪙 — Tienes: ${user.coins} 🪙`)

    user.coins -= total
    user.inventory[item.key] = (user.inventory[item.key] || 0) + cant
    await m.reply(`✅ *COMPRA REALIZADA*\n\n${item.emoji} ${item.name} x${cant}\n💸 Pagaste: *${total}* monedas\n💰 Saldo: *${user.coins}*\n🎒 Tienes: *${user.inventory[item.key]}*`)
  }
}
