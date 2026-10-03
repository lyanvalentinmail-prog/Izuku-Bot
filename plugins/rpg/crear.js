import { CLASES, crearPersonaje } from '../../lib/rpg.js'

export default {
  command: ['crear', 'personaje', 'clase'],
  category: 'rpg',
  desc: 'Crea tu personaje y elige clase',
  register: true,
  async run({ m, args, user, usedPrefix, command }) {
    const elegida = (args[0] || '').toLowerCase()

    if (!CLASES[elegida]) {
      let txt = `🎭 *ELIGE TU CLASE*\n\n`
      for (const [key, c] of Object.entries(CLASES)) {
        txt += `╭─ ${c.emoji} *${c.name}*\n│ ❤️ Vida: ${c.hp}  ⚔️ ATK: ${c.atk}  🛡️ DEF: ${c.def}\n│ 📝 ${c.desc}\n│ \`${usedPrefix}${command} ${key}\`\n╰────────────\n`
      }
      if (user.rpg) txt += `\n⚠️ Ya tienes un personaje *${CLASES[user.rpg.clase].name}* nivel *${user.rpg.level}*.\nCrear otro borrará tu progreso.`
      return m.reply(txt)
    }

    const nuevo = !user.rpg
    user.rpg = crearPersonaje(elegida)
    const c = CLASES[elegida]

    await m.reply(
`${nuevo ? '🎉 *¡PERSONAJE CREADO!*' : '♻️ *PERSONAJE REINICIADO*'}

${c.emoji} Clase: *${c.name}*
❤️ Vida: *${c.hp}*
⚔️ Ataque: *${c.atk}*
🛡️ Defensa: *${c.def}*
🏅 Nivel: *1*

🗺️ Empieza a jugar con *${usedPrefix}cazar*
📜 Mira tu ficha con *${usedPrefix}ficha*`)
  }
}
