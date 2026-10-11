import db from '../../lib/database.js'
export default {
  command: ['addcoins', 'darmonedas', 'delcoins'],
  category: 'owner',
  desc: 'Da o quita monedas a un usuario',
  owner: true,
  async run({ sock, m, args, command, usedPrefix }) {
    const target = m.mentionedJid[0] || m.quoted?.sender
    const monto = parseInt(args.find((a) => /^\d+$/.test(a)))
    if (!target || !monto) return m.reply(`💰 Uso: *${usedPrefix}${command} @usuario 1000*`)
    const u = db.user(target)
    if (command === 'delcoins') u.coins = Math.max(0, u.coins - monto)
    else u.coins += monto
    await sock.sendMessage(m.chat, {
      text: `✅ @${target.split('@')[0]} ahora tiene *${u.coins}* monedas.`,
      mentions: [target]
    }, { quoted: m })
  }
}
