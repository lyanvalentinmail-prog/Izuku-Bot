import db from '../../lib/database.js'
export default {
  command: ['warn', 'advertir', 'unwarn', 'quitarwarn'],
  category: 'grupos',
  desc: 'Sistema de advertencias (3 = expulsión)',
  group: true, admin: true,
  async run({ sock, m, text, command, isBotAdmin, usedPrefix }) {
    const target = m.mentionedJid[0] || m.quoted?.sender
    if (!target) return m.reply(`⚠️ Uso: *${usedPrefix}${command} @usuario [motivo]*`)
    const u = db.user(target)
    const motivo = text.replace(/@\d+/g, '').trim() || 'Sin motivo'

    if (['unwarn', 'quitarwarn'].includes(command)) {
      u.warn = Math.max(0, (u.warn || 0) - 1)
      return sock.sendMessage(m.chat, { text: `✅ Se le quitó una advertencia a @${target.split('@')[0]}\n⚠️ Ahora tiene *${u.warn}/3*`, mentions: [target] }, { quoted: m })
    }

    u.warn = (u.warn || 0) + 1
    if (u.warn >= 3) {
      u.warn = 0
      await sock.sendMessage(m.chat, { text: `🚫 @${target.split('@')[0]} llegó a *3 advertencias* y será expulsado.`, mentions: [target] }, { quoted: m })
      if (isBotAdmin) await sock.groupParticipantsUpdate(m.chat, [target], 'remove').catch(() => {})
      return
    }
    await sock.sendMessage(m.chat, {
      text: `⚠️ *ADVERTENCIA ${u.warn}/3*\n\n👤 @${target.split('@')[0]}\n📝 Motivo: ${motivo}\n\n_A las 3 advertencias se expulsa automáticamente._`,
      mentions: [target]
    }, { quoted: m })
  }
}
