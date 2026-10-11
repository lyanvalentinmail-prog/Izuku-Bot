import config from '../../config.js'
import { updateSettings } from '../../lib/settings.js'

export default {
  command: ['setprefix', 'prefijo'],
  category: 'owner',
  desc: 'Cambia el prefijo del bot en caliente (queda guardado)',
  owner: true,
  async run({ m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🔣 Uso: *${usedPrefix}${command} #*\nPrefijos actuales: ${config.prefix.map((p) => `*${p}*`).join(' ')}\n\nUsa *${usedPrefix}${command} vacio* para quitar el prefijo.`)
    const prefix = text.toLowerCase() === 'vacio' ? [''] : text.split(/\s+/)
    try {
      updateSettings({ prefix })
    } catch (e) {
      return m.reply(`⚠️ ${e.message}`)
    }
    await m.reply(`✅ Prefijo actualizado: ${config.prefix.map((p) => `*${p || '(ninguno)'}*`).join(' ')}\n\n💾 Queda guardado. También puedes cambiarlo desde el panel de control.`)
  }
}
