import fs from 'fs'
import path from 'path'
import db from '../../lib/database.js'
import { formatSize, formatTime } from '../../lib/functions.js'
import { subBots } from '../../lib/subbot.js'

const FILE = path.join(process.cwd(), 'database', 'database.json')

export default {
  command: ['db', 'database', 'datos'],
  category: 'owner',
  desc: 'Panel de administración de la base de datos',
  owner: true,
  async run({ m, args, usedPrefix, command }) {
    const accion = (args[0] || '').toLowerCase()
    const users = Object.entries(db.data.users)
    const chats = Object.entries(db.data.chats)

    switch (accion) {
      // ---------- Guardar ----------
      case 'save':
      case 'guardar': {
        db.save(true)
        return m.reply(`💾 Base de datos guardada.\n📦 Peso: *${formatSize(fs.statSync(FILE).size)}*`)
      }

      // ---------- Recargar desde disco ----------
      case 'load':
      case 'recargar': {
        db.load()
        return m.reply('♻️ Base de datos recargada desde el disco.')
      }

      // ---------- Compactar ----------
      case 'compact':
      case 'compactar': {
        const dias = parseInt(args[1]) || 60
        const antes = fs.existsSync(FILE) ? fs.statSync(FILE).size : 0
        const borrados = db.compactar(dias)
        const despues = fs.existsSync(FILE) ? fs.statSync(FILE).size : 0
        return m.reply(
`🧹 *COMPACTACIÓN*

Se eliminaron *${borrados}* usuarios fantasma
(sin registro ni progreso, inactivos +${dias} días)

📦 Antes: ${formatSize(antes)}
📦 Ahora: ${formatSize(despues)}
💾 Liberado: ${formatSize(Math.max(0, antes - despues))}`)
      }

      // ---------- Buscar un usuario ----------
      case 'user':
      case 'usuario': {
        const target = m.mentionedJid[0] || (args[1] ? `${args[1].replace(/\D/g, '')}@s.whatsapp.net` : null)
        if (!target) return m.reply(`🔍 Uso: *${usedPrefix}${command} user @usuario*`)
        const u = db.data.users[target]
        if (!u) return m.reply('❌ Ese usuario no está en la base de datos.')
        return m.reply(`🔍 *${target}*\n\n\`\`\`${JSON.stringify(u, null, 2).slice(0, 3000)}\`\`\``)
      }

      // ---------- Editar un campo ----------
      case 'set': {
        const target = m.mentionedJid[0]
        const campo = args[2]
        const valor = args.slice(3).join(' ')
        if (!target || !campo || valor === '') {
          return m.reply(`✏️ Uso: *${usedPrefix}${command} set @usuario coins 5000*`)
        }
        const u = db.user(target)
        let v = valor
        if (/^\d+$/.test(valor)) v = parseInt(valor)
        else if (valor === 'true') v = true
        else if (valor === 'false') v = false
        else if (valor === 'null') v = null
        u[campo] = v
        return m.reply(`✅ \`${campo}\` de @${target.split('@')[0]} = *${JSON.stringify(v)}*`)
      }

      // ---------- Listar ----------
      case 'top': {
        const lista = users
          .map(([jid, u]) => ({ jid, total: (u.coins || 0) + (u.bank || 0) }))
          .sort((a, b) => b.total - a.total).slice(0, 15)
        return m.reply(`📊 *TOP 15 POR MONEDAS*\n\n${lista.map((u, i) => `${i + 1}. ${u.jid.split('@')[0]} — ${u.total}`).join('\n')}`)
      }

      // ---------- Panel ----------
      default: {
        const peso = fs.existsSync(FILE) ? fs.statSync(FILE).size : 0
        const registrados = users.filter(([, u]) => u.registered).length
        const baneados = users.filter(([, u]) => u.banned).length
        const conRpg = users.filter(([, u]) => u.rpg).length
        const monedas = users.reduce((a, [, u]) => a + (u.coins || 0) + (u.bank || 0), 0)
        const mem = process.memoryUsage()

        return m.reply(
`╭━━〔 🗄️ *PANEL DE DATOS* 〕━━⬣
┃ 📦 Archivo: *${formatSize(peso)}*
┃ 🧠 RAM del bot: *${formatSize(mem.rss)}*
┃ ⏱️ Activo: *${formatTime(process.uptime() * 1000)}*
╰━━━━━━━━━━━━━━━━⬣

╭──〔 👥 *USUARIOS* 〕
│ Total: *${users.length}*
│ Registrados: *${registrados}*
│ Con personaje RPG: *${conRpg}*
│ Baneados: *${baneados}*
│ 💰 Monedas en circulación: *${monedas.toLocaleString('es')}*
╰────────────────⬣

╭──〔 💬 *CHATS* 〕
│ Guardados: *${chats.length}*
│ Grupos: *${chats.filter(([j]) => j.endsWith('@g.us')).length}*
│ Silenciados: *${chats.filter(([, c]) => c.mute).length}*
│ 🤖 Sub-bots activos: *${subBots.size}*
╰────────────────⬣

╭──〔 ⚙️ *ACCIONES* 〕
│ ${usedPrefix}db guardar
│ ${usedPrefix}db recargar
│ ${usedPrefix}db compactar [días]
│ ${usedPrefix}db user @usuario
│ ${usedPrefix}db set @usuario coins 5000
│ ${usedPrefix}db top
│ ${usedPrefix}backup — descargar copia
│ ${usedPrefix}restore — restaurar copia
│ ${usedPrefix}reset — menú de reinicio
╰────────────────⬣`)
      }
    }
  }
}
