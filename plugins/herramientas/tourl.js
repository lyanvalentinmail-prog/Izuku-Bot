import axios from 'axios'
import { formatSize } from '../../lib/functions.js'

export default {
  command: ['tourl', 'subir', 'upload'],
  category: 'herramientas',
  desc: 'Sube una foto/video/archivo y te da un enlace',
  async run({ m, usedPrefix, command }) {
    const target = m.quoted && ['imageMessage','videoMessage','audioMessage','documentMessage','stickerMessage'].includes(m.quoted.mtype)
      ? m.quoted
      : (['imageMessage','videoMessage','audioMessage','documentMessage','stickerMessage'].includes(m.mtype) ? m : null)
    if (!target) return m.reply(`🔗 Envía o responde a un archivo con *${usedPrefix}${command}* y te doy su enlace.`)

    await m.react('⏳')
    const buffer = await target.download()
    if (buffer.length > 90 * 1024 * 1024) return m.reply('⚠️ Máximo 90 MB.')

    const ext = { imageMessage: 'jpg', videoMessage: 'mp4', audioMessage: 'mp3', stickerMessage: 'webp' }[target.mtype] || 'bin'

    const intentos = [
      async () => {
        const form = new FormData()
        form.append('reqtype', 'fileupload')
        form.append('fileToUpload', new Blob([buffer]), `archivo.${ext}`)
        const { data } = await axios.post('https://catbox.moe/user/api.php', form, { timeout: 120000 })
        return String(data).trim()
      },
      async () => {
        const form = new FormData()
        form.append('files[]', new Blob([buffer]), `archivo.${ext}`)
        const { data } = await axios.post('https://uguu.se/upload.php?output=text', form, { timeout: 120000 })
        return String(data).trim()
      }
    ]

    for (const fn of intentos) {
      try {
        const url = await fn()
        if (url?.startsWith('http')) {
          await m.reply(`🔗 *ARCHIVO SUBIDO*\n\n${url}\n\n📦 Peso: *${formatSize(buffer.length)}*\n📄 Tipo: ${ext.toUpperCase()}`)
          return m.react('✅')
        }
      } catch {}
    }
    await m.reply('❌ No pude subir el archivo. Inténtalo más tarde.')
  }
}
