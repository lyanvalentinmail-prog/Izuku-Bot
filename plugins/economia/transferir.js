import db from '../../lib/database.js'
export default {
  command: ['pay', 'transferir', 'dar'],
  category: 'economia',
  desc: 'Transfiere monedas a otro usuario',
  register: true,
  async run({ sock, m, args, user, usedPrefix, command }) {
    const target = m.mentionedJid[0] || m.quoted?.sender
    const monto = parseInt(args.find((a) => /^\d+$/.test(a)))
    if (!target || !monto) return m.reply(`💸 Uso: *${usedPrefix}${command} @usuario 500*`)
    if (monto < 1) return m.reply('⚠️ Monto inválido.')
    if (monto > user.coins) return m.reply(`💸 Solo tienes *${user.coins}* monedas.`)
    user.coins -= monto
    db.user(target).coins += monto
    await sock.sendMessage(m.chat, {
      text: `✅ Transferiste *${monto}* monedas a @${target.split('@')[0]}\n💰 Tu saldo: *${user.coins}*`,
      mentions: [target]
    }, { quoted: m })
  }
}
