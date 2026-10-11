import fs from 'fs'
import config from '../../config.js'
export default {
  command: ['setprefix', 'prefijo'],
  category: 'owner',
  desc: 'Cambia el prefijo del bot en caliente',
  owner: true,
  async run({ m, text, usedPrefix, command }) {
    if (!text) return m.reply(`🔣 Uso: *${usedPrefix}${command} #*\nPrefijos actuales: ${config.prefix.map((p) => `*${p}*`).join(' ')}\n\nUsa *${usedPrefix}${command} vacio* para quitar el prefijo.`)
    config.prefix = text.toLowerCase() === 'vacio' ? [''] : text.split(/\s+/)
    await m.reply(`✅ Prefijo actualizado: ${config.prefix.map((p) => `*${p || '(ninguno)'}*`).join(' ')}\n\n⚠️ El cambio es temporal. Para que sea permanente edita *config.js*.`)
  }
}
