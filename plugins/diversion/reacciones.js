import { getJson } from '../../lib/functions.js'

// Todas las categorias son SFW
const ACCIONES = {
  abrazar:  { api: 'hug',     txt: 'abraza a' },
  chocalos: { api: 'highfive', txt: 'choca los cinco con' },
  aplaudir: { api: 'happy',   txt: 'aplaude a' },
  bailar:   { api: 'dance',   txt: 'baila con' },
  saludar:  { api: 'wave',    txt: 'saluda a' },
  acariciar:{ api: 'pat',     txt: 'acaricia a' },
  sonreir:  { api: 'smile',   txt: 'le sonríe a' }
}

export default {
  command: Object.keys(ACCIONES),
  category: 'diversion',
  desc: 'Reacciones animadas: abrazar, chocalos, bailar, saludar...',
  group: true,
  async run({ sock, m, command, usedPrefix }) {
    const target = m.mentionedJid[0] || m.quoted?.sender
    if (!target) return m.reply(`🤗 Uso: *${usedPrefix}${command} @usuario*\n\nDisponibles: ${Object.keys(ACCIONES).join(', ')}`)
    const a = ACCIONES[command]
    try {
      const d = await getJson(`https://api.waifu.pics/sfw/${a.api}`)
      await sock.sendMessage(m.chat, {
        video: { url: d.url }, gifPlayback: true,
        caption: `@${m.sender.split('@')[0]} ${a.txt} @${target.split('@')[0]} 💫`,
        mentions: [m.sender, target]
      }, { quoted: m })
    } catch {
      await sock.sendMessage(m.chat, { text: `@${m.sender.split('@')[0]} ${a.txt} @${target.split('@')[0]} 💫`, mentions: [m.sender, target] }, { quoted: m })
    }
  }
}
