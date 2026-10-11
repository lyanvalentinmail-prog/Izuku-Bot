import { downloadMedia } from '../../lib/serialize.js'

export default {
  command: ['reveal', 'revelar', 'ver', 'vv', 'antiviewonce'],
  category: 'herramientas',
  desc: 'Revela una foto/video/audio de "ver una sola vez"',

  async run({ sock, m, usedPrefix, command }) {
    const q = m.quoted
    if (!q) {
      return m.reply(
`👁️ *REVELAR "VER UNA VEZ"*

Responde a una foto, video o audio de *ver una sola vez* con *${usedPrefix}${command}* y te lo reenvío como mensaje normal.

💡 También puedes activarlo automático en un grupo:
*${usedPrefix}autoreveal on*`)
    }

    const tipo = q.mtype
    if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(tipo)) {
      return m.reply('⚠️ Eso no es una foto, video ni audio.')
    }
    if (!q.isViewOnce) {
      return m.reply('ℹ️ Ese mensaje no es de "ver una sola vez", puedes verlo las veces que quieras.')
    }

    await m.react('👁️')
    const buffer = await q.download()
    const info = `👁️ *REVELADO*\n_Enviado originalmente como "ver una sola vez"_`

    if (tipo === 'imageMessage') {
      await sock.sendMessage(m.chat, { image: buffer, caption: `${info}${q.msg?.caption ? `\n\n💬 ${q.msg.caption}` : ''}` }, { quoted: m })
    } else if (tipo === 'videoMessage') {
      await sock.sendMessage(m.chat, { video: buffer, caption: `${info}${q.msg?.caption ? `\n\n💬 ${q.msg.caption}` : ''}` }, { quoted: m })
    } else {
      await sock.sendMessage(m.chat, { audio: buffer, mimetype: 'audio/mpeg', ptt: true }, { quoted: m })
      await m.reply(info)
    }
    await m.react('✅')
  }
}
