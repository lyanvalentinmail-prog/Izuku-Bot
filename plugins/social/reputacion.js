import db from '../../lib/database.js'
import { formatTime } from '../../lib/functions.js'

export default {
  command: ['rep', 'reputacion', 'toprep'],
  category: 'social',
  desc: 'Da reputación a alguien (una vez cada 12 h)',
  async run({ sock, m, user, command, usedPrefix }) {
    if (command === 'toprep') {
      const lista = Object.entries(db.data.users)
        .filter(([, u]) => u.rep > 0)
        .sort((a, b) => b[1].rep - a[1].rep).slice(0, 10)
      if (!lista.length) return m.reply('📭 Nadie tiene reputación todavía.')
      return sock.sendMessage(m.chat, {
        text: `⭐ *TOP REPUTACIÓN*\n\n${lista.map(([j, u], i) => `${['🥇','🥈','🥉'][i] || `${i+1}.`} @${j.split('@')[0]} — *${u.rep}* ⭐`).join('\n')}`,
        mentions: lista.map(([j]) => j)
      }, { quoted: m })
    }

    const target = m.mentionedJid[0] || m.quoted?.sender
    if (!target) return m.reply(`⭐ Uso: *${usedPrefix}${command} @usuario*`)
    if (target === m.sender) return m.reply('🤨 No puedes darte reputación a ti mismo.')

    user.lastRep = user.lastRep || 0
    const wait = 43200000 - (Date.now() - user.lastRep)
    if (wait > 0) return m.reply(`⏳ Ya diste reputación hace poco.\nVuelve en *${formatTime(wait)}*.`)

    user.lastRep = Date.now()
    const u = db.user(target)
    u.rep = (u.rep || 0) + 1

    await sock.sendMessage(m.chat, {
      text: `⭐ @${m.sender.split('@')[0]} le dio *+1 reputación* a @${target.split('@')[0]}\n\nAhora tiene *${u.rep}* ⭐`,
      mentions: [m.sender, target]
    }, { quoted: m })
  }
}
