export default {
  command: ['setwelcome', 'setbienvenida', 'setbye', 'setdespedida'],
  category: 'grupos',
  desc: 'Personaliza el mensaje de bienvenida/despedida',
  group: true, admin: true,
  async run({ m, text, chat, command, usedPrefix }) {
    const esBye = command.includes('bye') || command.includes('desped')
    const campo = esBye ? 'textoBye' : 'textoWelcome'

    if (!text) {
      return m.reply(
`✏️ *PERSONALIZAR ${esBye ? 'DESPEDIDA' : 'BIENVENIDA'}*

Uso: *${usedPrefix}${command} <mensaje>*

Variables disponibles:
• *@user* → menciona a la persona
• *@grupo* → nombre del grupo
• *@desc* → descripción del grupo
• *@miembros* → cantidad de miembros

Ejemplo:
*${usedPrefix}${command} ¡Hola @user! Bienvenido a @grupo, ya somos @miembros.*

Actual:
_${chat[campo] || '(el mensaje por defecto)'}_

Para volver al predeterminado: *${usedPrefix}${command} reset*`)
    }

    if (text.toLowerCase() === 'reset') {
      delete chat[campo]
      return m.reply('♻️ Mensaje restablecido al predeterminado.')
    }

    chat[campo] = text
    await m.reply(`✅ ${esBye ? 'Despedida' : 'Bienvenida'} personalizada guardada:\n\n_${text}_`)
  }
}
