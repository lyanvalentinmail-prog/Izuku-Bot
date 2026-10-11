import fs from 'fs'
import path from 'path'
import config from '../../config.js'
import { formatSize } from '../../lib/functions.js'
import { updateSettings } from '../../lib/settings.js'

export default {
  command: ['setbanner', 'setmenu', 'banner'],
  category: 'owner',
  desc: 'Cambia la imagen del menú (responde a una foto)',
  owner: true,
  async run({ sock, m, usedPrefix, command }) {
    const target = m.quoted?.mtype === 'imageMessage' ? m.quoted : (m.mtype === 'imageMessage' ? m : null)
    if (!target) {
      const actual = fs.existsSync(config.menuImage)
        ? `✅ Banner actual: *${config.menuImage}* (${formatSize(fs.statSync(config.menuImage).size)})`
        : '⚠️ Ahora mismo no hay banner, el menú se envía solo con texto.'
      return m.reply(
`🖼️ *CAMBIAR EL BANNER DEL MENÚ*

Envía una imagen con el texto *${usedPrefix}${command}*
o responde a una imagen con *${usedPrefix}${command}*

${actual}`)
    }

    await m.react('⏳')
    const buffer = await target.download()
    if (buffer.length > 8 * 1024 * 1024) return m.reply('⚠️ La imagen es muy pesada (máximo 8 MB).')

    const destino = path.join(process.cwd(), 'media', 'banner.jpg')
    fs.mkdirSync(path.dirname(destino), { recursive: true })
    fs.writeFileSync(destino, buffer)
    updateSettings({ menuImage: './media/banner.jpg' })

    await sock.sendMessage(m.chat, {
      image: buffer,
      caption:
`✅ *BANNER ACTUALIZADO*

📁 Guardado en: *media/banner.jpg*
📦 Peso: *${formatSize(buffer.length)}*

Prueba ahora con *${usedPrefix}menu* 🎉

_Quedó guardado: el menú usará esta imagen aunque reinicies el bot._`
    }, { quoted: m })
    await m.react('✅')
  }
}
