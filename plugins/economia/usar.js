import { findItem } from '../../lib/shop.js'
export default {
  command: ['usar', 'use'],
  category: 'economia',
  desc: 'Usa un objeto consumible de tu inventario',
  register: true,
  async run({ m, args, user, usedPrefix, command }) {
    const item = findItem(args[0])
    if (!item) return m.reply(`🧪 Uso: *${usedPrefix}${command} pocion*`)
    if (item.type !== 'consumable') return m.reply(`⚠️ *${item.name}* no se puede usar.`)
    if (!user.inventory?.[item.key]) return m.reply(`🎒 No tienes ninguna *${item.name}*.`)

    user.inventory[item.key]--
    if (user.inventory[item.key] <= 0) delete user.inventory[item.key]

    if (item.key === 'pocion') {
      user.lastWork = 0
      return m.reply(`🧪 Usaste una *Poción*.\n\n⚡ Tu descanso de *${usedPrefix}work* se reinició. ¡Puedes trabajar ya!`)
    }
    if (item.key === 'cebo') {
      user.inventory.cebo = (user.inventory.cebo || 0) + 1 // el cebo se gasta al pescar
      return m.reply('🪱 El cebo se usa automáticamente al *pescar*, guárdalo para entonces.')
    }
    await m.reply(`✅ Usaste *${item.name}*.`)
  }
}
