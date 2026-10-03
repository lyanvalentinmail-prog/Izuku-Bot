import fs from 'fs'
import path from 'path'
import db from '../../lib/database.js'

const FILE = path.join(process.cwd(), 'database', 'database.json')
const pendientes = new Map()   // confirmaciones pendientes

const OPCIONES = {
  todo:      'TODO (usuarios, chats y ajustes)',
  usuarios:  'todos los usuarios',
  economia:  'solo la economía (monedas, banco, inventario)',
  rpg:       'solo los personajes RPG',
  niveles:   'solo niveles y experiencia',
  chats:     'la configuración de todos los chats',
  usuario:   'un usuario concreto'
}

export default {
  command: ['reset', 'reiniciardatos', 'resetall'],
  category: 'owner',
  desc: 'Reinicia datos del bot (con confirmación)',
  owner: true,
  async run({ m, args, usedPrefix, command }) {
    const que = (args[0] || '').toLowerCase()

    // ---------- Menú ----------
    if (!OPCIONES[que]) {
      return m.reply(
`╭━━〔 ⚠️ *REINICIAR DATOS* 〕━━⬣
┃ Esto *borra información* y no se
┃ puede deshacer. Haz antes un
┃ *${usedPrefix}backup*.
╰━━━━━━━━━━━━━━━━⬣

${Object.entries(OPCIONES).map(([k, v]) => `🔸 *${usedPrefix}${command} ${k}*\n   _Borra ${v}_`).join('\n\n')}

📌 Para un usuario concreto:
*${usedPrefix}${command} usuario @alguien*

_Tras elegir, te pediré confirmar con *${usedPrefix}${command} confirmar*_`)
    }

    // ---------- Confirmación ----------
    const clave = m.sender
    const pendiente = pendientes.get(clave)

    if (args[0]?.toLowerCase() === 'confirmar') return m.reply('⚠️ Primero elige qué borrar.')

    if (!pendiente || pendiente.que !== que || Date.now() - pendiente.time > 60000) {
      pendientes.set(clave, { que, time: Date.now(), target: m.mentionedJid[0] })
      const cuantos = que === 'usuario'
        ? (m.mentionedJid[0] ? `@${m.mentionedJid[0].split('@')[0]}` : '⚠️ menciona a alguien')
        : `${Object.keys(db.data.users).length} usuarios`
      return m.reply(
`⚠️ *¿SEGURO?*

Vas a borrar: *${OPCIONES[que]}*
Afecta a: *${cuantos}*

✅ Para confirmar, repite el comando dentro de 60 segundos:
*${usedPrefix}${command} ${que}*

❌ Para cancelar, simplemente no hagas nada.`)
    }

    // ---------- Ejecución ----------
    pendientes.delete(clave)
    fs.copyFileSync(FILE, `${FILE}.antes-del-reset`)
    let detalle = ''

    switch (que) {
      case 'todo':
        db.data = { users: {}, chats: {}, settings: {}, subbots: {} }
        detalle = 'Base de datos completamente vacía.'
        break
      case 'usuarios': {
        const n = Object.keys(db.data.users).length
        db.data.users = {}
        detalle = `${n} usuarios eliminados.`
        break
      }
      case 'economia':
        for (const u of Object.values(db.data.users)) {
          u.coins = 500; u.bank = 0; u.inventory = {}
          u.lastDaily = 0; u.lastWork = 0; u.lastRob = 0; u.lastMine = 0; u.lastFish = 0
        }
        detalle = 'Economía reiniciada (todos con 500 monedas).'
        break
      case 'rpg': {
        let n = 0
        for (const u of Object.values(db.data.users)) if (u.rpg) { u.rpg = null; n++ }
        detalle = `${n} personajes RPG borrados.`
        break
      }
      case 'niveles':
        for (const u of Object.values(db.data.users)) { u.level = 1; u.exp = 0 }
        detalle = 'Niveles y experiencia a cero.'
        break
      case 'chats': {
        const n = Object.keys(db.data.chats).length
        db.data.chats = {}
        detalle = `${n} chats restablecidos a su configuración por defecto.`
        break
      }
      case 'usuario': {
        const target = pendiente.target || m.mentionedJid[0]
        if (!target) return m.reply('⚠️ Tienes que mencionar al usuario.')
        delete db.data.users[target]
        detalle = `Datos de @${target.split('@')[0]} eliminados.`
        break
      }
    }

    db.save(true)
    await m.reply(
`✅ *REINICIO COMPLETADO*

🗑️ ${detalle}

_Se guardó una copia previa como \`database.json.antes-del-reset\` por si te arrepientes._`)
  }
}
