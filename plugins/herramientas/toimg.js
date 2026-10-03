import { toSticker } from '../../lib/functions.js'
import { exec } from 'child_process'
import fs from 'fs'
import { promisify } from 'util'
import { tmpFile } from '../../lib/functions.js'
const execAsync = promisify(exec)

export default {
  command: ['toimg', 'aimagen'],
  category: 'herramientas',
  desc: 'Convierte un sticker en imagen',
  async run({ sock, m }) {
    const q = m.quoted
    if (!q || q.mtype !== 'stickerMessage') return m.reply('🖼️ Responde a un *sticker* con este comando.')
    await m.react('⏳')
    const buffer = await q.download()
    const input = tmpFile('webp'); const output = tmpFile('png')
    fs.writeFileSync(input, buffer)
    await execAsync(`ffmpeg -y -i "${input}" "${output}"`)
    await sock.sendMessage(m.chat, { image: fs.readFileSync(output), caption: '🖼️ Aquí tienes tu imagen.' }, { quoted: m })
    try { fs.unlinkSync(input); fs.unlinkSync(output) } catch {}
    await m.react('✅')
  }
}
