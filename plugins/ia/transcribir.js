import axios from 'axios'
export default {
  command: ['transcribir', 'texto', 'stt'],
  category: 'ia',
  desc: 'Convierte una nota de voz en texto',
  async run({ m, usedPrefix, command }) {
    const q = m.quoted
    if (!q || !['audioMessage', 'videoMessage'].includes(q.mtype)) {
      return m.reply(`🎙️ Responde a una *nota de voz* con *${usedPrefix}${command}*`)
    }
    await m.react('⏳')
    const buffer = await q.download()

    const intentos = [
      async () => {
        const form = new FormData()
        form.append('audio', new Blob([buffer], { type: 'audio/ogg' }), 'audio.ogg')
        const { data } = await axios.post('https://api.siputzx.my.id/api/ai/whisper', form, { timeout: 120000 })
        return data?.data?.text || data?.data
      }
    ]
    for (const fn of intentos) {
      try {
        const texto = await fn()
        if (texto) {
          await m.reply(`🎙️ *TRANSCRIPCIÓN*\n\n${texto}`)
          return m.react('✅')
        }
      } catch {}
    }
    await m.reply('❌ El servicio de transcripción no respondió. Inténtalo más tarde.')
  }
}
