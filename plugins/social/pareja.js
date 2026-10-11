import db from '../../lib/database.js'

export default {
  command: ['casarse', 'divorciarse', 'pareja', 'matrimonio'],
  category: 'social',
  desc: 'Cásate con alguien del grupo',
  register: true, group: true,
  async run({ sock, m, user, command, usedPrefix }) {
    if (command === 'divorciarse') {
      if (!user.pareja) return m.reply('💔 No estás casado con nadie.')
      const ex = user.pareja
      db.user(ex).pareja = null
      user.pareja = null
      return sock.sendMessage(m.chat, { text: `💔 @${m.sender.split('@')[0]} y @${ex.split('@')[0]} se han divorciado.`, mentions: [m.sender, ex] }, { quoted: m })
    }

    if (command === 'pareja' || command === 'matrimonio') {
      const target = m.mentionedJid[0] || m.sender
      const u = db.user(target)
      if (!u.pareja) return sock.sendMessage(m.chat, { text: `💔 @${target.split('@')[0]} está soltero/a.`, mentions: [target] }, { quoted: m })
      const dias = Math.floor((Date.now() - (u.bodaFecha || Date.now())) / 86400000)
      return sock.sendMessage(m.chat, {
        text: `💍 @${target.split('@')[0]} está casado/a con @${u.pareja.split('@')[0]}\n📅 Llevan *${dias}* días juntos.`,
        mentions: [target, u.pareja]
      }, { quoted: m })
    }

    // ---------- Casarse ----------
    const target = m.mentionedJid[0] || m.quoted?.sender
    if (!target) return m.reply(`💍 Uso: *${usedPrefix}casarse @usuario*`)
    if (target === m.sender) return m.reply('🤨 No puedes casarte contigo mismo.')
    if (user.pareja) return m.reply(`💍 Ya estás casado. Usa *${usedPrefix}divorciarse* primero.`)

    const otro = db.user(target)
    if (otro.pareja) return m.reply('💔 Esa persona ya está casada.')
    if (user.coins < 2000) return m.reply(`💸 El anillo cuesta *2000* monedas y tienes *${user.coins}*.`)

    user.coins -= 2000
    user.pareja = target; user.bodaFecha = Date.now()
    otro.pareja = m.sender; otro.bodaFecha = Date.now()

    await sock.sendMessage(m.chat, {
      text: `💒 *¡BODA!*\n\n@${m.sender.split('@')[0]} 💍 @${target.split('@')[0]}\n\n¡Felicidades a los novios! 🎉\n💸 Anillo: 2000 monedas`,
      mentions: [m.sender, target]
    }, { quoted: m })
  }
}
