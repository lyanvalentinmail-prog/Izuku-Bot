export default {
  command: ['reglas', 'rules', 'setreglas'],
  category: 'grupos',
  desc: 'Muestra o define las reglas del grupo',
  group: true,
  async run({ m, text, chat, command, isAdmin, isOwner, usedPrefix, groupMetadata }) {
    if (command === 'setreglas') {
      if (!isAdmin && !isOwner) return m.reply('⚠️ Solo los admins pueden definir las reglas.')
      if (!text) return m.reply(`📜 Uso: *${usedPrefix}${command} 1. Respeto\n2. Nada de spam*\n\n_Para borrarlas: ${usedPrefix}${command} reset_`)
      if (text.toLowerCase() === 'reset') { delete chat.reglas; return m.reply('🗑️ Reglas eliminadas.') }
      chat.reglas = text
      return m.reply(`✅ Reglas guardadas.\nMíralas con *${usedPrefix}reglas*`)
    }

    if (!chat.reglas) {
      return m.reply(`📜 Este grupo todavía no tiene reglas.\n\n_Un admin puede ponerlas con:_\n*${usedPrefix}setreglas 1. Respeto...*`)
    }
    await m.reply(`📜 *REGLAS DE ${groupMetadata?.subject?.toUpperCase() || 'EL GRUPO'}*\n\n${chat.reglas}\n\n_Incumplirlas puede acabar en expulsión._`)
  }
}
