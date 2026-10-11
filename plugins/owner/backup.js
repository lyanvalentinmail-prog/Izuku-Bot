import fs from 'fs'
import path from 'path'
import db from '../../lib/database.js'
import { formatSize } from '../../lib/functions.js'

const FILE = path.join(process.cwd(), 'database', 'database.json')

export default {
  command: ['backup', 'copia', 'restore', 'restaurar'],
  category: 'owner',
  desc: 'Descarga o restaura una copia de la base de datos',
  owner: true,
  async run({ sock, m, command, usedPrefix }) {
    // ---------- RESTAURAR ----------
    if (['restore', 'restaurar'].includes(command)) {
      const q = m.quoted
      if (!q || q.mtype !== 'documentMessage') {
        return m.reply(`♻️ Responde al archivo *.json* del backup con *${usedPrefix}${command}*`)
      }
      await m.react('⏳')
      const buffer = await q.download()
      let data
      try { data = JSON.parse(buffer.toString('utf-8')) } catch { return m.reply('❌ El archivo no es un JSON válido.') }
      if (!data.users || !data.chats) return m.reply('❌ Ese JSON no parece una base de datos de Izuku Bot.')

      // Guardamos la actual por si acaso
      fs.copyFileSync(FILE, `${FILE}.antes-de-restaurar`)
      db.data = { users: {}, chats: {}, settings: {}, subbots: {}, ...data }
      db.save(true)

      return m.reply(
`✅ *BASE DE DATOS RESTAURADA*

👥 Usuarios: *${Object.keys(data.users).length}*
💬 Chats: *${Object.keys(data.chats).length}*

_La base anterior se guardó como \`database.json.antes-de-restaurar\` por seguridad._`)
    }

    // ---------- BACKUP ----------
    db.save(true)
    const fecha = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    await sock.sendMessage(m.chat, {
      document: fs.readFileSync(FILE),
      mimetype: 'application/json',
      fileName: `izuku-backup-${fecha}.json`,
      caption:
`💾 *COPIA DE SEGURIDAD*

📅 ${new Date().toLocaleString('es')}
👥 Usuarios: *${Object.keys(db.data.users).length}*
💬 Chats: *${Object.keys(db.data.chats).length}*
📦 Peso: *${formatSize(fs.statSync(FILE).size)}*

_Guarda este archivo. Para restaurarlo, respóndelo con *${usedPrefix}restore*_`
    }, { quoted: m })
  }
}
