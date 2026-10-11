export default {
  command: ['mute', 'silenciar', 'unmute', 'activar'],
  category: 'owner',
  desc: 'Silencia al bot en este chat',
  owner: true,
  async run({ m, chat, command }) {
    chat.mute = ['mute', 'silenciar'].includes(command)
    await m.reply(chat.mute ? '🔇 Bot silenciado en este chat. Usa *unmute* para reactivarlo.' : '🔊 Bot reactivado en este chat.')
  }
}
