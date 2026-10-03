import { exec } from 'child_process'
import fs from 'fs'
import { promisify } from 'util'
import { tmpFile } from '../../lib/functions.js'
const execAsync = promisify(exec)

const FILTROS = {
  pixelar:   { f: 'scale=iw/18:ih/18:flags=neighbor,scale=iw*18:ih*18:flags=neighbor', emoji: '🟦', nombre: 'Pixelado' },
  blur:      { f: 'boxblur=12:2', emoji: '🌫️', nombre: 'Desenfocado' },
  espejo:    { f: 'hflip', emoji: '🪞', nombre: 'Espejo' },
  invertir:  { f: 'negate', emoji: '🔃', nombre: 'Negativo' },
  bn:        { f: 'hue=s=0', emoji: '⚫', nombre: 'Blanco y negro' },
  sepia:     { f: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131', emoji: '🟤', nombre: 'Sepia' },
  brillo:    { f: 'eq=brightness=0.25:saturation=1.6', emoji: '🔆', nombre: 'Brillante' },
  circulo:   { f: "scale=512:512,format=rgba,geq=r='r(X,Y)':a='if(gt(hypot(X-256,Y-256),256),0,255)'", emoji: '⭕', nombre: 'Circular', png: true }
}

export default {
  command: Object.keys(FILTROS),
  category: 'imagen',
  desc: 'Filtros: pixelar, blur, espejo, invertir, bn, sepia, brillo, circulo',
  async run({ sock, m, command, usedPrefix }) {
    const target = m.quoted?.mtype === 'imageMessage' ? m.quoted : (m.mtype === 'imageMessage' ? m : null)
    if (!target) {
      return m.reply(`🖼️ Envía o responde a una *imagen* con *${usedPrefix}${command}*\n\nFiltros disponibles:\n${Object.entries(FILTROS).map(([k, v]) => `${v.emoji} ${usedPrefix}${k} — ${v.nombre}`).join('\n')}`)
    }
    await m.react('⏳')
    const filtro = FILTROS[command]
    const input = tmpFile('jpg')
    const output = tmpFile(filtro.png ? 'png' : 'jpg')
    fs.writeFileSync(input, await target.download())
    await execAsync(`ffmpeg -y -i "${input}" -vf "${filtro.f}" "${output}"`)
    await sock.sendMessage(m.chat, { image: fs.readFileSync(output), caption: `${filtro.emoji} *${filtro.nombre}*` }, { quoted: m })
    try { fs.unlinkSync(input); fs.unlinkSync(output) } catch {}
    await m.react('✅')
  }
}
