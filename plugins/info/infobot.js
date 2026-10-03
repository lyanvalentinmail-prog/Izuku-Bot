import config from '../../config.js'
import db from '../../lib/database.js'
import { formatSize, formatTime, systemInfo } from '../../lib/functions.js'
import { subBots } from '../../lib/subbot.js'

export default {
  command: ['infobot', 'info', 'estado', 'status'],
  category: 'info',
  desc: 'Información técnica del bot y del servidor',
  async run({ m, plugins }) {
    const s = systemInfo()
    const mem = process.memoryUsage()
    await m.reply(
`╭──「 ℹ️ *INFO DEL BOT* 」
│ 🤖 Nombre: ${config.botName}
│ 👑 Dueño: ${config.ownerName}
│ 📂 Comandos: ${plugins.size}
│ 👥 Usuarios: ${Object.keys(db.data.users).length}
│ 💬 Chats: ${Object.keys(db.data.chats).length}
│ 🤖 Sub-bots: ${subBots.size}
│ ⏱️ Activo: ${formatTime(process.uptime() * 1000)}
╰────────────────
╭──「 🖥️ *SERVIDOR* 」
│ 💻 SO: ${s.platform} (${s.arch})
│ ⚙️ CPU: ${s.cpu}
│ 🔢 Núcleos: ${s.cores}
│ 🧠 RAM: ${s.freeMem} libres de ${s.totalMem}
│ 📊 Uso del bot: ${formatSize(mem.rss)}
│ 🟢 Node: ${s.node}
╰────────────────`)
  }
}
