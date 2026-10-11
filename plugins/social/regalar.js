import db from '../../lib/database.js'
import { findItem } from '../../lib/shop.js'

export default {
  command: ['regalar', 'gift'],
  category: 'social',
  desc: 'Regala un objeto de tu inventario',
  register: true,
  async run({ sock, m, args, user, usedPrefix, command }) {
    const target = m.mentionedJid[0] || m.quoted?.sender
    const item = findItem(args.find((a) => !a.startsWith('@') && !/^\d+$/.test(a)))
    const cant = Math.max(1, parseInt(args.find((a) => /^\d+$/.test(a))) || 1)
    if (!target || !item) return m.reply(`🎁 Uso: *${usedPrefix}${command} @usuario diamante 2*`)
    if (target === m.sender) return m.reply('🤨 Regalarte a ti mismo no tiene mucho sentido.')
    if ((user.inventory?.[item.key] || 0) < cant) return m.reply(`🎒 No tienes ${cant}x *${item.name}*.`)

    user.inventory[item.key] -= cant
    if (user.inventory[item.key] <= 0) delete user.inventory[item.key]
    const otro = db.user(target)
    otro.inventory = otro.inventory || {}
    otro.inventory[item.key] = (otro.inventory[item.key] || 0) + cant

    await sock.sendMessage(m.chat, {
      text: `🎁 @${m.sender.split('@')[0]} le regaló ${item.emoji} *${item.name} x${cant}* a @${target.split('@')[0]}`,
      mentions: [m.sender, target]
    }, { quoted: m })
  }
}
