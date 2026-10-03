import fs from 'fs'
import config from '../../config.js'
import db from '../../lib/database.js'
import { formatTime, random } from '../../lib/functions.js'
import { subBots } from '../../lib/subbot.js'

// ===============================================
//  Estilo del menu. Edita estas tablas para
//  cambiar emojis, titulos u orden de categorias.
// ===============================================

export const CATS = {
  info:         { emoji: 'ℹ️', title: 'INFORMACIÓN',           sub: 'Datos del bot' },
  perfil:       { emoji: '👤', title: 'PERFIL',                 sub: 'Tu cuenta y nivel' },
  ia:           { emoji: '🧠', title: 'INTELIGENCIA ARTIFICIAL', sub: 'Chat e imágenes con IA' },
  herramientas: { emoji: '🛠️', title: 'HERRAMIENTAS',           sub: 'Utilidades del día a día' },
  descargas:    { emoji: '📥', title: 'DESCARGAS',              sub: 'Música, videos y redes' },
  stickers:     { emoji: '🎨', title: 'STICKERS',               sub: 'Crea tus figuritas' },
  juegos:       { emoji: '🎮', title: 'JUEGOS',                 sub: 'Diversión rápida' },
  rpg:          { emoji: '🗡️', title: 'RPG',                    sub: 'Aventura, combate y niveles' },
  anime:        { emoji: '🎌', title: 'ANIME',                  sub: 'Fichas, frases y Quirks' },
  diversion:    { emoji: '🎭', title: 'DIVERSIÓN',              sub: 'Memes, chistes y reacciones' },
  estudio:      { emoji: '📚', title: 'ESTUDIO',                sub: 'Ayuda para la escuela' },
  tecnico:      { emoji: '🔐', title: 'TÉCNICO',                sub: 'Hash, base64, redes' },
  productividad:{ emoji: '📅', title: 'PRODUCTIVIDAD',          sub: 'Encuestas, notas y recordatorios' },
  imagen:       { emoji: '🖼️', title: 'IMAGEN',                 sub: 'Editar y mejorar fotos' },
  social:       { emoji: '🤝', title: 'SOCIAL',                 sub: 'Clanes, parejas y reputación' },
  internacional:{ emoji: '🌍', title: 'INTERNACIONAL',          sub: 'Horas, divisas y países' },
  economia:     { emoji: '💰', title: 'ECONOMÍA',               sub: 'Monedas, tienda e inventario' },
  busqueda:     { emoji: '🔎', title: 'BÚSQUEDA',               sub: 'Encuentra lo que sea' },
  grupos:       { emoji: '👥', title: 'GRUPOS',                 sub: 'Administración' },
  subbots:      { emoji: '🤖', title: 'SUB-BOTS',               sub: 'Sé un bot tú también' },
  owner:        { emoji: '👑', title: 'DUEÑO',                  sub: 'Solo el creador' }
}

const ORDER = Object.keys(CATS)

const TIPS = [
  'Responde a una imagen con *{p}s* para convertirla en sticker.',
  'Usa *{p}crear* para empezar tu aventura RPG.',
  'Con *{p}daily* reclamas monedas gratis cada 24 horas.',
  'Prueba *{p}ia* y pregúntale lo que quieras.',
  'Compra un pico en la *{p}tienda* y empieza a *{p}minar*.',
  'Con *{p}jadibot* puedes convertir tu número en un bot.',
  'Escribe *{p}menu rpg* para ver solo una categoría.',
  '*{p}play* descarga la canción que le pidas.',
  'Equípate con *{p}equipar espada* antes de ir a *{p}cazar*.',
  'Usa *{p}afk durmiendo* y el bot avisará por ti.'
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

/** Parte un texto largo por lineas, sin cortar ninguna a la mitad */
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

export default {
  command: ['menu', 'help', 'ayuda', 'comandos'],
  category: 'info',
  desc: 'Muestra todos los comandos disponibles',

  async run({ sock, m, plugins, usedPrefix, user, text }) {
    // Agrupar por categoria
    const cats = {}
    for (const p of plugins.values()) {
      if (p.hidden) continue
      const c = p.category || 'info'
      ;(cats[c] = cats[c] || []).push(p)
    }

    let filtro = text?.toLowerCase().trim()
    const keys = [...ORDER.filter((k) => cats[k]), ...Object.keys(cats).filter((k) => !ORDER.includes(k))]

    // .menu todo -> lista completa  |  .menu -> vista compacta  |  .menu <cat> -> esa categoria
    const verTodo = ['todo', 'all', 'completo'].includes(filtro)
    if (verTodo) filtro = null
    const compacto = !filtro && !verTodo

    // Si piden una categoria que no existe
    if (filtro && !cats[filtro]) {
      const lista = keys.map((k) => `  ${CATS[k]?.emoji || '📁'} ${k}`).join('\n')
      return m.reply(`❌ No existe la categoría *${filtro}*.\n\n📂 *Categorías disponibles:*\n${lista}\n\n💡 Ej: *${usedPrefix}menu rpg*`)
    }

    const s = saludo()
    const nombre = user.name || m.pushName || 'aventurero'
    const need = user.level * 100
    const pct = Math.min(100, Math.floor((user.exp / need) * 100))
    const barra = '▰'.repeat(Math.round(pct / 10)).padEnd(10, '▱')
    const registrado = user.registered ? '✅' : '❌'
    const rpg = user.rpg ? `🗡️ Nv.${user.rpg.level}` : '🗡️ sin personaje'

    // ---------- Cabecera ----------
    let txt = compacto
      // Vista compacta: cabe como pie de foto, asi se ve el banner
      ? `╭━━〔 ${s.emoji} *${config.botName.toUpperCase()}* 〕━━⬣
┃ ${s.txt}, *${nombre}*
┃ 🏅 Nv.${user.level} ${barra} · 💰 ${user.coins}
┃ ⏱️ ${formatTime(process.uptime() * 1000)} · 📂 ${plugins.size} cmd · 🔣 ${usedPrefix || 'sin prefijo'}
╰━━━━━━━━━━━━━━━⬣
`
      : `╭━━━〔 ${s.emoji} *${config.botName.toUpperCase()}* 〕━━━⬣
┃ ${s.txt}, *${nombre}* ${s.emoji}
┃ ${random(FRASES)}
╰━━━━━━━━━━━━━━━━━⬣

╭──〔 👤 *TU PROGRESO* 〕
│ 🏅 Nivel *${user.level}*  ${barra} ${pct}%
│ 💰 Monedas: *${user.coins}*  🏦 Banco: *${user.bank}*
│ 🎒 Objetos: *${Object.values(user.inventory || {}).reduce((a, b) => a + b, 0)}*  ${rpg}
│ 📝 Registrado: ${registrado}  📊 Comandos: *${user.commands}*
╰────────────────⬣

╭──〔 🤖 *ESTADO DEL BOT* 〕
│ ⏱️ Activo: *${formatTime(process.uptime() * 1000)}*
│ 📂 Comandos: *${plugins.size}*  📁 Categorías: *${keys.length}*
│ 👥 Usuarios: *${Object.keys(db.data.users).length}*  🤖 Sub-bots: *${subBots.size}*
│ 🔣 Prefijo: *${usedPrefix || 'ninguno'}*
╰────────────────⬣
`

    // ---------- Categorias ----------
    if (compacto) {
      // Vista rapida: una linea por categoria
      txt += `\n╭──〔 📂 *CATEGORÍAS* 〕\n`
      for (const key of keys) {
        const c = CATS[key] || { emoji: '📁', title: key.toUpperCase() }
        txt += `│ ${c.emoji} ${c.title} _(${cats[key].length})_\n`
      }
      txt += '╰────────────────⬣\n'
    } else {
      for (const key of keys) {
        if (filtro && key !== filtro) continue
        const c = CATS[key] || { emoji: '📁', title: key.toUpperCase(), sub: '' }
        const lista = cats[key].sort((a, b) => a.command[0].localeCompare(b.command[0]))

        txt += `\n╭──〔 ${c.emoji} *${c.title}* 〕 _${lista.length}_\n`
        if (c.sub) txt += `│ _${c.sub}_\n│\n`
        for (const p of lista) {
          txt += `│ ✦ ${usedPrefix}${p.command[0]}\n`
          if (p.desc) txt += `│   ◦ _${p.desc}_\n`
        }
        txt += '╰────────────────⬣\n'
      }
    }

    // ---------- Pie ----------
    txt += compacto
      ? `\n📜 *${usedPrefix}menu todo* — los ${plugins.size} comandos
📖 *${usedPrefix}menu <categoría>* — ej: ${usedPrefix}menu rpg
💡 ${random(TIPS).replace(/\{p\}/g, usedPrefix)}

   ⋆｡°✩ ${config.botName} ✩°｡⋆`
      : `\n╭──〔 💡 *CONSEJO* 〕
│ ${random(TIPS).replace(/\{p\}/g, usedPrefix)}
╰────────────────⬣

📂 *${usedPrefix}categorias* — lista de categorías
📜 *${usedPrefix}menu todo* — todos los comandos
📖 *${usedPrefix}menu <categoría>* — filtrar
👑 Creador: *${config.ownerName}* — *${usedPrefix}owner*

      ⋆｡°✩ ${config.botName} ✩°｡⋆`

    // ---------- Envio con tarjeta ----------
    const contextInfo = {
      externalAdReply: {
        title: `${config.botName} — ${plugins.size} comandos`,
        body: `${s.txt}, ${nombre} ${s.emoji}`,
        thumbnailUrl: config.menuImage,
        sourceUrl: config.newsletter,
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }

    // Acepta una URL o un archivo local (ej: './media/banner.jpg')
    let imagen = null
    try {
      const esUrl = /^https?:\/\//.test(config.menuImage || '')
      imagen = esUrl
        ? { url: config.menuImage }
        : fs.existsSync(config.menuImage) ? fs.readFileSync(config.menuImage) : null
    } catch {}

    const botones = [
      { id: `${usedPrefix}categorias`, texto: '📂 Ver categorías' },
      { id: `${usedPrefix}infobot`, texto: 'ℹ️ Info del bot' },
      { id: `${usedPrefix}owner`, texto: '👑 Creador' }
    ]

    // WhatsApp recorta los pies de foto largos: si el texto no cabe,
    // lo mandamos como mensajes de texto troceados.
    const LIMITE = 1024
    if (txt.length > LIMITE) {
      const trozos = partir(txt, 3500)
      for (let i = 0; i < trozos.length; i++) {
        const esUltimo = i === trozos.length - 1
        const pie = trozos.length > 1 ? `\n\n_— parte ${i + 1}/${trozos.length} —_` : ''
        if (esUltimo) {
          await sock.sendButtons(m.chat, trozos[i] + pie, `${config.botName} • ${plugins.size} comandos`, botones, m, { contextInfo })
        } else {
          await sock.sendMessage(m.chat, { text: trozos[i] + pie }, { quoted: m })
        }
      }
      return
    }

    try {
      await sock.sendButtons(m.chat, txt, `${config.botName} • ${plugins.size} comandos`, botones, m, { image: imagen, contextInfo })
    } catch {
      await sock.sendMessage(m.chat, { text: txt, contextInfo }, { quoted: m }).catch(() => m.reply(txt))
    }
  }
}
