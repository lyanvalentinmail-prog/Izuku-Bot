import db from '../../lib/database.js'
import { combate, stats } from '../../lib/rpg.js'

function clanes() {
  db.data.clanes = db.data.clanes || {}
  return db.data.clanes
}

export default {
  command: ['clan', 'gremio'],
  category: 'social',
  desc: 'Clanes: crear, unirse, info, salir, guerra',
  register: true,
  async run({ sock, m, args, user, usedPrefix, command }) {
    const C = clanes()
    const accion = (args[0] || 'info').toLowerCase()
    const nombre = args.slice(1).join(' ').trim()
    const miClan = Object.entries(C).find(([, c]) => c.miembros.includes(m.sender))

    switch (accion) {
      case 'crear': {
        if (miClan) return m.reply(`⚠️ Ya perteneces al clan *${miClan[0]}*. Sal con *${usedPrefix}${command} salir*`)
        if (!nombre || nombre.length < 3) return m.reply(`🏰 Uso: *${usedPrefix}${command} crear Los Héroes*`)
        if (C[nombre]) return m.reply('⚠️ Ya existe un clan con ese nombre.')
        if (user.coins < 5000) return m.reply(`💸 Crear un clan cuesta *5000* monedas y tienes *${user.coins}*.`)
        user.coins -= 5000
        C[nombre] = { lider: m.sender, miembros: [m.sender], puntos: 0, creado: Date.now(), banco: 0 }
        return m.reply(`🏰 *CLAN CREADO*\n\n🏷️ ${nombre}\n👑 Líder: tú\n💸 Costo: 5000 monedas\n\nInvita con *${usedPrefix}${command} unirse ${nombre}*`)
      }

      case 'unirse': {
        if (miClan) return m.reply(`⚠️ Ya estás en *${miClan[0]}*.`)
        if (!C[nombre]) return m.reply(`❌ No existe el clan *${nombre}*.\nMira la lista con *${usedPrefix}${command} lista*`)
        if (C[nombre].miembros.length >= 20) return m.reply('⚠️ Ese clan está lleno (20 miembros).')
        C[nombre].miembros.push(m.sender)
        return m.reply(`🎉 Te uniste al clan *${nombre}*\n👥 Miembros: ${C[nombre].miembros.length}`)
      }

      case 'salir': {
        if (!miClan) return m.reply('⚠️ No estás en ningún clan.')
        const [n, c] = miClan
        c.miembros = c.miembros.filter((j) => j !== m.sender)
        if (c.lider === m.sender) {
          if (c.miembros.length) c.lider = c.miembros[0]
          else { delete C[n]; return m.reply(`🏚️ Saliste y el clan *${n}* se disolvió.`) }
        }
        return m.reply(`👋 Saliste del clan *${n}*.`)
      }

      case 'lista': {
        const lista = Object.entries(C).sort((a, b) => b[1].puntos - a[1].puntos).slice(0, 10)
        if (!lista.length) return m.reply(`📭 Todavía no hay clanes.\nCrea el primero con *${usedPrefix}${command} crear <nombre>*`)
        return m.reply(`🏰 *CLANES*\n\n${lista.map(([n, c], i) => `${['🥇','🥈','🥉'][i] || `${i+1}.`} *${n}*\n    👥 ${c.miembros.length} · 🏆 ${c.puntos} pts`).join('\n')}`)
      }

      case 'guerra': {
        if (!miClan) return m.reply('⚠️ No estás en ningún clan.')
        if (!user.rpg) return m.reply(`🗡️ Necesitas un personaje RPG (*${usedPrefix}crear*).`)
        if (!C[nombre]) return m.reply(`⚔️ Uso: *${usedPrefix}${command} guerra <clan rival>*`)
        if (nombre === miClan[0]) return m.reply('🤨 No puedes atacar a tu propio clan.')

        const rival = C[nombre]
        const defensores = rival.miembros.map((j) => db.data.users[j]).filter((u) => u?.rpg)
        if (!defensores.length) return m.reply('⚠️ Ese clan no tiene miembros con personaje RPG.')
        const def = defensores.sort((a, b) => b.rpg.level - a.rpg.level)[0]
        const sd = stats(def.rpg)

        const res = combate(user.rpg, { name: `campeón de ${nombre}`, hp: sd.maxHp, atk: sd.atk, def: sd.def })
        user.rpg.hp = res.hpJugador
        const gano = res.ganador === 'jugador'
        if (gano) { miClan[1].puntos += 10; rival.puntos = Math.max(0, rival.puntos - 5); user.coins += 1500 }
        else { rival.puntos += 10; miClan[1].puntos = Math.max(0, miClan[1].puntos - 5) }

        return m.reply(
`⚔️ *GUERRA DE CLANES*

🏰 ${miClan[0]}  🆚  🏰 ${nombre}

${res.log.slice(0, 5).join('\n')}

${gano ? `🏆 *¡VICTORIA!*\n+10 puntos para tu clan\n💰 +1500 monedas` : '💀 *DERROTA*\n-5 puntos para tu clan'}

🏆 ${miClan[0]}: *${miClan[1].puntos}* pts
🏆 ${nombre}: *${rival.puntos}* pts`)
      }

      default: {
        if (!miClan) {
          return m.reply(
`🏰 *CLANES*

No perteneces a ningún clan.

🔸 *${usedPrefix}${command} crear <nombre>* — 5000 monedas
🔸 *${usedPrefix}${command} unirse <nombre>*
🔸 *${usedPrefix}${command} lista*
🔸 *${usedPrefix}${command} guerra <clan>*`)
        }
        const [n, c] = miClan
        return sock.sendMessage(m.chat, {
          text:
`🏰 *CLAN ${n.toUpperCase()}*

👑 Líder: @${c.lider.split('@')[0]}
👥 Miembros: *${c.miembros.length}/20*
🏆 Puntos: *${c.puntos}*
📅 Creado: ${new Date(c.creado).toLocaleDateString('es')}

*Integrantes:*
${c.miembros.map((j) => `• @${j.split('@')[0]}`).join('\n')}

⚔️ Ataca con *${usedPrefix}${command} guerra <clan>*`,
          mentions: c.miembros
        }, { quoted: m })
      }
    }
  }
}
