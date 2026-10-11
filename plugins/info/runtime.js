import { formatTime } from '../../lib/functions.js'
export default {
  command: ['runtime', 'uptime', 'activo'],
  category: 'info',
  desc: 'Tiempo que lleva el bot encendido',
  async run({ m }) {
    await m.reply(`⏱️ El bot lleva activo:\n*${formatTime(process.uptime() * 1000)}*`)
  }
}
