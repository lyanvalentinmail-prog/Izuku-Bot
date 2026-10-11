import axios from 'axios'

export default {
  command: ['quitarfondo', 'removebg', 'sinfondo'],
  category: 'imagen',
  desc: 'Quita el fondo de una imagen',
  async run({ sock, m, usedPrefix, command }) {
    const target = m.quoted?.mtype === 'imageMessage' ? m.quoted : (m.mtype === 'imageMessage' ? m : null)
    if (!target) return m.reply(`✂️ Envía o responde a una imagen con *${usedPrefix}${command}*`)
    await m.react('⏳')
    const buffer = await target.download()

    // Varias APIs publicas de respaldo (si una cae, se prueba la siguiente)
    const intentos = [
      async () => {
        // FormData nativo de Node 18+, sin dependencias extra
        const form = new FormData()
        form.append('file', new Blob([buffer], { type: 'image/jpeg' }), 'img.jpg')
        const { data } = await axios.post('https://api.siputzx.my.id/api/iloveimg/removebg', form, {
          responseType: 'arraybuffer', timeout: 90000
        })
        return Buffer.from(data)
      },
      async () => {
        const form = new FormData()
        form.append('image', new Blob([buffer], { type: 'image/jpeg' }), 'img.jpg')
        const { data } = await axios.post('https://api.nyxs.pw/tools/removebg', form, {
          responseType: 'arraybuffer', timeout: 90000
        })
        return Buffer.from(data)
      }
    ]
    for (const fn of intentos) {
      try {
        const out = await fn()
        if (out?.length > 1000) {
          await sock.sendMessage(m.chat, { image: out, caption: '✂️ *Fondo eliminado*' }, { quoted: m })
          return m.react('✅')
        }
      } catch {}
    }
    await m.reply('❌ El servicio para quitar fondos no respondió. Inténtalo más tarde.\n\n_Puedes añadir más endpoints en `plugins/imagen/quitarfondo.js`._')
  }
}
