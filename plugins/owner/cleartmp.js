import fs from 'fs'
import path from 'path'
import { formatSize } from '../../lib/functions.js'
import { TEMP_DIR } from '../../lib/paths.js'
export default {
  command: ['cleartmp', 'limpiar'],
  category: 'owner',
  desc: 'Borra los archivos temporales',
  owner: true,
  async run({ m }) {
    const dir = TEMP_DIR
    if (!fs.existsSync(dir)) return m.reply('✅ No hay nada que limpiar.')
    let total = 0, count = 0
    for (const f of fs.readdirSync(dir)) {
      if (f === '.gitkeep') continue
      const file = path.join(dir, f)
      try { total += fs.statSync(file).size; fs.unlinkSync(file); count++ } catch {}
    }
    await m.reply(`🧹 Limpieza completada.\nArchivos borrados: *${count}*\nEspacio liberado: *${formatSize(total)}*`)
  }
}
