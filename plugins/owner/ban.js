import db from '../../lib/database.js'
export default {
  command: ['ban', 'banear', 'unban', 'desbanear'],
  category: 'owner',
  desc: 'Bloquea o desbloquea a un usuario del bot',
  owner: true,
  async run({ sock, m, text, command, usedPrefix }) {
    const target = m.mentionedJid[0] || m.quoted?.sender || (text ? `${text.replace(/\D/g, '')}@s.whatsapp.net` : null)
    if (!target || target === '@s.whatsapp.net') return m.reply(`🚫 Uso: *${usedPrefix}${command} @usuario*`)
    const ban = ['ban', 'banear'].includes(command)
    db.user(target).banned = ban
    await sock.sendMessage(m.chat, {
      text: `${ban ? '🚫 Baneado' : '✅ Desbaneado'}: @${target.split('@')[0]}`,
      mentions: [target]
    }, { quoted: m })
  }
}
