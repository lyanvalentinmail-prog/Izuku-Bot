import fs from 'fs'
import config from '../../config.js'
import db from '../../lib/database.js'
import { formatTime, random } from '../../lib/functions.js'
import { subBots } from '../../lib/subbot.js'

// ===============================================
//  MENÚ DE IZUKU BOT
//  Edita CATS para cambiar emojis, títulos u orden.
// ===============================================

export const CATS = {
  info:         { emoji: 'ℹ️', title: 'INFORMACIÓN',            sub: 'Datos del bot' },
  perfil:       { emoji: '👤', title: 'PERFIL',                  sub: 'Tu cuenta y nivel' },
  ia:           { emoji: '🧠', title: 'INTELIGENCIA ARTIFICIAL', sub: 'Chat e imágenes con IA' },
  herramientas: { emoji: '🛠️', title: 'HERRAMIENTAS',            sub: 'Utilidades del día a día' },
  descargas:    { emoji: '📥', title: 'DESCARGAS',               sub: 'Música, videos y redes' },
  stickers:     { emoji: '🎨', title: 'STICKERS',                sub: 'Crea tus figuritas' },
  juegos:       { emoji: '🎮', title: 'JUEGOS',                  sub: 'Diversión rápida' },
  rpg:          { emoji: '🗡️', title: 'RPG',                     sub: 'Aventura, combate y niveles' },
  anime:        { emoji: '🎌', title: 'ANIME',                   sub: 'Fichas, frases y Quirks' },
  diversion:    { emoji: '🎭', title: 'DIVERSIÓN',               sub: 'Memes, chistes y reacciones' },
  estudio:      { emoji: '📚', title: 'ESTUDIO',                 sub: 'Ayuda para la escuela' },
  tecnico:      { emoji: '🔐', title: 'TÉCNICO',                 sub: 'Hash, base64, redes' },
  productividad:{ emoji: '📅', title: 'PRODUCTIVIDAD',           sub: 'Encuestas, notas y recordatorios' },
  imagen:       { emoji: '🖼️', title: 'IMAGEN',                  sub: 'Editar y mejorar fotos' },
  social:       { emoji: '🤝', title: 'SOCIAL',                  sub: 'Clanes, parejas y reputación' },
  internacional:{ emoji: '🌍', title: 'INTERNACIONAL',           sub: 'Horas, divisas y países' },
  actualidad:   { emoji: '📰', title: 'ACTUALIDAD',              sub: 'Noticias, cripto y horóscopo' },
  economia:     { emoji: '💰', title: 'ECONOMÍA',                sub: 'Monedas, tienda e inventario' },
  busqueda:     { emoji: '🔎', title: 'BÚSQUEDA',                sub: 'Encuentra lo que sea' },
  grupos:       { emoji: '👥', title: 'GRUPOS',                  sub: 'Administración' },
  subbots:      { emoji: '🤖', title: 'SUB-BOTS',                sub: 'Sé un bot tú también' },
  owner:        { emoji: '👑', title: 'DUEÑO',                   sub: 'Solo el creador' }
}

const ORDER = Object.keys(CATS)

const TIPS = [
  'Responde a una imagen con *{p}s* para convertirla en sticker.',
  'Usa *{p}crear* para empezar tu aventura RPG.',
  'Con *{p}daily* reclamas monedas gratis cada 24 horas.',
  'Prueba *{p}ia* y pregúntale lo que quieras.',
  'Compra un pico en la *{p}tienda* y empieza a *{p}minar*.',
  'Con *{p}jadibot* puedes convertir tu número en un bot.',
  '*{p}play* descarga la canción que le pidas.',
  'Equípate con *{p}equipar espada* antes de ir a *{p}cazar*.',
  'Usa *{p}afk durmiendo* y el bot avisará por ti.',
  'Responde a un "ver una vez" con *{p}reveal* para verlo siempre.',
  'Busca comandos escribiendo *{p}menu <palabra>*.',
  'Mira cómo funciona cualquier comando con *{p}ayuda <comando>*.',
  '*{p}encuesta Pregunta | A | B* crea una votación real.',
  'Con *{p}misiones* ganas monedas extra cada día.'
]

const FRASES = [
  '¡Plus Ultra! 💥',
  'Un héroe siempre llega a tiempo. 🦸',
  'Puedes ser un héroe. 💚',
  'El poder no lo es todo, el corazón sí. ❤️',
  '¡Vamos a darlo todo! 🔥'
]

function saludo() {
  const h = new Date().getHours()
  if (h < 6) return { txt: 'Buenas noches', emoji: '🌙' }
  if (h < 12) return { txt: 'Buenos días', emoji: '🌅' }
  if (h < 19) return { txt: 'Buenas tardes', emoji: '☀️' }
  return { txt: 'Buenas noches', emoji: '🌃' }
}

/** Barra de progreso bonita */
function barra(pct, largo = 10) {
  const n = Math.round((pct / 100) * largo)
  return `${'▰'.repeat(n)}${'▱'.repeat(largo - n)}`
}

/** Parte un texto largo por líneas, sin cortar ninguna a la mitad */
function partir(texto, max) {
  const lineas = texto.split('\n')
  const trozos = []
  let actual = ''
  for (const l of lineas) {
    if ((actual + l).length > max) { trozos.push(actual); actual = '' }
    actual += l + '\n'
  }
  if (actual.trim()) trozos.push(actual)
  return trozos
}

/** Candado si el usuario no puede usar ese comando */
function candado(p, { isOwner, isAdmin, isGroup }) {
  if (p.owner || p.rowner) return isOwner ? '' : ' 🔒'
  if (p.admin) return isAdmin || isOwner ? '' : ' 🔒'
  if (p.group && !isGroup) return ' 👥'
  if (p.private && isGroup) return ' 💬'
  return ''
}

export default {
  command: ['menu', 'help', 'ayuda', 'comandos', 'menú'],
  category: 'info',
  desc: 'Menú de comandos, buscador y ayuda detallada',

  async run({ sock, m, plugins, usedPrefix, user, text, isOwner, isAdmin }) {
    const permisos = { isOwner, isAdmin, isGroup: m.isGroup }

    // ---------- Agrupar ----------
    const cats = {}
    for (const p of plugins.values()) {
      if (p.hidden) continue
      ;(cats[p.category || 'info'] = cats[p.category || 'info'] || []).push(p)
    }
    const keys = [...ORDER.filter((k) => cats[k]), ...Object.keys(cats).filter((k) => !ORDER.includes(k))]

    const consulta = (text || '').toLowerCase().trim()
    const verTodo = ['todo', 'all', 'completo', 'full'].includes(consulta)
    const esCategoria = !!cats[consulta]
    const compacto = !consulta

    // ======================================================
    //  1) AYUDA DETALLADA DE UN COMANDO  ->  .ayuda sticker
    // ======================================================
    if (consulta && !verTodo && !esCategoria) {
      const limpio = consulta.replace(new RegExp(`^\\${usedPrefix}`), '')
      const exacto = [...plugins.values()].find((p) => p.command.includes(limpio))

      if (exacto) {
        const c = CATS[exacto.category] || { emoji: '📁', title: exacto.category.toUpperCase() }
        const reqs = [
          exacto.owner && '👑 Solo el dueño',
          exacto.admin && '🛡️ Solo admins del grupo',
          exacto.botAdmin && '🤖 El bot debe ser admin',
          exacto.group && '👥 Solo en grupos',
          exacto.private && '💬 Solo en privado',
          exacto.register && '📝 Hay que estar registrado'
        ].filter(Boolean)

        return m.reply(
`╭━━〔 📖 *AYUDA* 〕━━⬣
┃ ${usedPrefix}${exacto.command[0]}
╰━━━━━━━━━━━━━━━⬣

📝 *Qué hace:*
${exacto.desc || 'Sin descripción.'}

${c.emoji} *Categoría:* ${c.title}
🔤 *Atajos:* ${exacto.command.map((x) => `${usedPrefix}${x}`).join(' · ')}
${reqs.length ? `\n🔐 *Requisitos:*\n${reqs.map((r) => `   • ${r}`).join('\n')}` : '✅ *Sin restricciones*'}

💡 Escribe *${usedPrefix}${exacto.command[0]}* sin nada para ver su modo de uso.
📂 Más de esta categoría: *${usedPrefix}menu ${exacto.category}*`)
      }

      // ---------- 2) BUSCADOR ----------
      const hits = [...plugins.values()].filter((p) =>
        !p.hidden && (
          p.command.some((c) => c.includes(limpio)) ||
          (p.desc || '').toLowerCase().includes(limpio) ||
          (CATS[p.category]?.title || '').toLowerCase().includes(limpio)
        ))

      if (hits.length) {
        let txt = `╭━━〔 🔍 *BÚSQUEDA* 〕━━⬣\n┃ "${consulta}" — *${hits.length}* resultado(s)\n╰━━━━━━━━━━━━━━━⬣\n`
        for (const p of hits.slice(0, 25)) {
          const c = CATS[p.category] || { emoji: '📁' }
          txt += `\n${c.emoji} *${usedPrefix}${p.command[0]}*${candado(p, permisos)}\n   _${p.desc || '—'}_`
        }
        if (hits.length > 25) txt += `\n\n_...y ${hits.length - 25} más._`
        txt += `\n\n📖 Detalle: *${usedPrefix}ayuda ${hits[0].command[0]}*`
        return m.reply(txt)
      }

      // ---------- 3) Nada encontrado ----------
      return m.reply(
`❌ No encontré *${consulta}*.

📂 *Categorías disponibles:*
${keys.map((k) => `   ${CATS[k]?.emoji || '📁'} ${k} _(${cats[k].length})_`).join('\n')}

💡 Prueba:
• *${usedPrefix}menu* — menú principal
• *${usedPrefix}menu todo* — los ${plugins.size} comandos
• *${usedPrefix}menu descargar* — buscar por palabra`)
    }

    // ======================================================
    //  4) MENÚ
    // ======================================================
    const s = saludo()
    const nombre = user.name || m.pushName || 'aventurero'
    const need = user.level * 100
    const pct = Math.min(100, Math.floor((user.exp / need) * 100))
    const objetos = Object.values(user.inventory || {}).reduce((a, b) => a + b, 0)
    const disponibles = [...plugins.values()].filter((p) => !p.hidden && !candado(p, permisos)).length

    // Tus comandos favoritos (los que más usas)
    const favoritos = Object.entries(user.cmdStats || {})
      .sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([c, n]) => `${usedPrefix}${c} _(${n})_`).join(' · ')

    let txt

    if (compacto) {
      // ---------- Vista principal: cabe como pie de foto ----------
      txt =
`╭━━━〔 ${s.emoji} *${config.botName.toUpperCase()}* 〕━━━⬣
┃ ${s.txt}, *${nombre}*
┃ 🏅 Nv.${user.level} ${barra(pct)} ${pct}%
┃ 💰 ${user.coins.toLocaleString('es')} · 🎒 ${objetos} · ${user.rpg ? `🗡️ Nv.${user.rpg.level}` : '🗡️ —'}
╰━━━━━━━━━━━━━━━━━⬣

╭──〔 📂 *${keys.length} CATEGORÍAS* 〕`

      for (const key of keys) {
        const c = CATS[key] || { emoji: '📁', title: key.toUpperCase() }
        txt += `\n│ ${c.emoji} ${c.title} _(${cats[key].length})_`
      }

      txt +=
`\n╰────────────────⬣

╭──〔 🚀 *CÓMO USARLO* 〕
│ 📜 *${usedPrefix}menu todo* — los ${plugins.size} comandos
│ 📂 *${usedPrefix}menu rpg* — una categoría
│ 🔍 *${usedPrefix}menu musica* — buscar
│ 📖 *${usedPrefix}ayuda sticker* — cómo funciona
│ 📁 *${usedPrefix}categorias* — índice detallado
╰────────────────⬣
${favoritos ? `\n⭐ *Tus más usados:* ${favoritos}` : ''}
💡 ${random(TIPS).replace(/\{p\}/g, usedPrefix)}

   ⋆｡°✩ ${config.botName} ✩°｡⋆`
    } else {
      // ---------- Vista completa / por categoría ----------
      txt =
`╭━━━〔 ${s.emoji} *${config.botName.toUpperCase()}* 〕━━━⬣
┃ ${s.txt}, *${nombre}* ${s.emoji}
┃ ${random(FRASES)}
╰━━━━━━━━━━━━━━━━━⬣

╭──〔 👤 *TU PROGRESO* 〕
│ 🏅 Nivel *${user.level}*  ${barra(pct)} ${pct}%
│ 💰 Monedas: *${user.coins.toLocaleString('es')}*  🏦 Banco: *${user.bank.toLocaleString('es')}*
│ 🎒 Objetos: *${objetos}*  ${user.rpg ? `🗡️ RPG Nv.*${user.rpg.level}*` : '🗡️ Sin personaje'}
│ 📝 Registrado: ${user.registered ? '✅' : '❌'}  📊 Comandos usados: *${user.commands}*
╰────────────────⬣

╭──〔 🤖 *ESTADO DEL BOT* 〕
│ ⏱️ Activo: *${formatTime(process.uptime() * 1000)}*
│ 📂 Comandos: *${plugins.size}* (puedes usar *${disponibles}*)
│ 📁 Categorías: *${keys.length}*
│ 👥 Usuarios: *${Object.keys(db.data.users).length}*  🤖 Sub-bots: *${subBots.size}*
│ 🔣 Prefijo: *${usedPrefix || 'ninguno'}*
╰────────────────⬣
`

      for (const key of keys) {
        if (esCategoria && key !== consulta) continue
        const c = CATS[key] || { emoji: '📁', title: key.toUpperCase(), sub: '' }
        const lista = cats[key].sort((a, b) => a.command[0].localeCompare(b.command[0]))

        txt += `\n╭──〔 ${c.emoji} *${c.title}* 〕 _${lista.length}_\n`
        if (c.sub) txt += `│ _${c.sub}_\n│\n`
        for (const p of lista) {
          txt += `│ ✦ ${usedPrefix}${p.command[0]}${candado(p, permisos)}\n`
          if (p.desc) txt += `│   ◦ _${p.desc}_\n`
        }
        txt += '╰────────────────⬣\n'
      }

      txt +=
`\n🔒 _= necesitas permisos_   👥 _= solo grupos_

╭──〔 💡 *CONSEJO* 〕
│ ${random(TIPS).replace(/\{p\}/g, usedPrefix)}
╰────────────────⬣

📖 *${usedPrefix}ayuda <comando>* — ayuda detallada
🔍 *${usedPrefix}menu <palabra>* — buscador
👑 Creador: *${config.ownerName}* — *${usedPrefix}owner*

      ⋆｡°✩ ${config.botName} ✩°｡⋆`
    }

    // ---------- Envío ----------
    let imagen = null
    try {
      const esUrl = /^https?:\/\//.test(config.menuImage || '')
      imagen = esUrl
        ? { url: config.menuImage }
        : fs.existsSync(config.menuImage) ? fs.readFileSync(config.menuImage) : null
    } catch {}

    const contextInfo = {
      externalAdReply: {
        title: `${config.botName} — ${plugins.size} comandos`,
        body: `${s.txt}, ${nombre} ${s.emoji}`,
        thumbnailUrl: /^https?:\/\//.test(config.menuImage || '') ? config.menuImage : undefined,
        sourceUrl: config.newsletter,
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }

    const botones = compacto ? [] : [
      { id: `${usedPrefix}menu todo`, texto: '📜 Todos los comandos' },
      { id: `${usedPrefix}categorias`, texto: '📂 Ver categorías' },
      { id: `${usedPrefix}infobot`, texto: 'ℹ️ Info del bot' }
    ]

    // WhatsApp recorta los pies de foto largos: si no cabe, va como texto troceado
    if (txt.length > 1024) {
      const trozos = partir(txt, 3500)
      for (let i = 0; i < trozos.length; i++) {
        const pie = trozos.length > 1 ? `\n\n_— parte ${i + 1}/${trozos.length} —_` : ''
        if (i === trozos.length - 1) {
          await sock.sendButtons(m.chat, trozos[i] + pie, `${config.botName} • ${plugins.size} comandos`, botones, m, { contextInfo })
        } else {
          await sock.sendMessage(m.chat, { text: trozos[i] + pie }, { quoted: m })
        }
      }
      return
    }

    await sock.sendButtons(m.chat, txt, `${config.botName} • ${plugins.size} comandos`, botones, m, { image: imagen, contextInfo })
  }
}
