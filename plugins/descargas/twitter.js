import { getBuffer, getJson } from '../../lib/functions.js'

export default {
  command: ['twitter', 'x', 'tw'],
  category: 'descargas',
  desc: 'Descarga videos de X / Twitter',
  async run({ sock, m, text, usedPrefix, command }) {
    if (!/(twitter|x)\.com/.test(text)) return m.reply(`🐦 Uso: *${usedPrefix}${command} https://x.com/usuario/status/123*`)
    await m.react('⏳')
    const apis = [
      async () => (await getJson(`https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(text)}`))?.data?.media?.find((x) => x.type === 'video')?.url,
      async () => (await getJson(`https://api.vreden.my.id/api/twitter?url=${encodeURIComponent(text)}`))?.result?.media?.[0]?.url
    ]
    for (const fn of apis) {
      try {
        const link = await fn()
        if (link) {
          await sock.sendMessage(m.chat, { video: await getBuffer(link), caption: '🐦 *Descargado de X*' }, { quoted: m })
          return m.react('✅')
        }
      } catch {}
    }
    await m.reply('❌ No pude descargar ese enlace. Puede ser privado o solo texto.')
  }
}
