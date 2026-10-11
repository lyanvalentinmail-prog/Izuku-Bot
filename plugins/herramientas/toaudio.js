import { exec } from 'child_process'
import fs from 'fs'
import { promisify } from 'util'
import { tmpFile } from '../../lib/functions.js'
const execAsync = promisify(exec)

export default {
  command: ['toaudio', 'tomp3', 'tovn', 'tonota'],
  category: 'herramientas',
  desc: 'Convierte un video o audio en MP3 / nota de voz',
  async run({ sock, m, command, usedPrefix }) {
    const q = m.quoted
    if (!q || !['videoMessage', 'audioMessage', 'documentMessage'].includes(q.mtype)) {
      return m.reply(`🎧 Responde a un *video* o *audio* con *${usedPrefix}${command}*`)
    }
    await m.react('⏳')
    const ptt = ['tovn', 'tonota'].includes(command)
    const input = tmpFile('bin')
    const output = tmpFile(ptt ? 'opus' : 'mp3')
    fs.writeFileSync(input, await q.download())

    const cmd = ptt
      ? `ffmpeg -y -i "${input}" -c:a libopus -b:a 64k -vbr on -ac 1 -ar 48000 "${output}"`
      : `ffmpeg -y -i "${input}" -vn -c:a libmp3lame -b:a 128k "${output}"`
    await execAsync(cmd)

    await sock.sendMessage(m.chat, {
      audio: fs.readFileSync(output),
      mimetype: ptt ? 'audio/ogg; codecs=opus' : 'audio/mpeg',
      ptt,
      fileName: ptt ? 'nota.opus' : 'audio.mp3'
    }, { quoted: m })
    try { fs.unlinkSync(input); fs.unlinkSync(output) } catch {}
    await m.react('✅')
  }
}
