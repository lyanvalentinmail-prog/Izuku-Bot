import axios from 'axios'
import { exec } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

/** Formatea bytes a algo legible */
export function formatSize(bytes = 0) {
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (bytes >= 1024 && i < u.length - 1) { bytes /= 1024; i++ }
  return `${bytes.toFixed(2)} ${u[i]}`
}

/** Formatea milisegundos a 1d 2h 3m 4s */
export function formatTime(ms = 0) {
  const s = Math.floor(ms / 1000) % 60
  const m = Math.floor(ms / (1000 * 60)) % 60
  const h = Math.floor(ms / (1000 * 60 * 60)) % 24
  const d = Math.floor(ms / (1000 * 60 * 60 * 24))
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ')
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export const random = (arr) => arr[Math.floor(Math.random() * arr.length)]

export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

/** Descarga una url y devuelve un Buffer */
export async function getBuffer(url, options = {}) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) IzukuBot/1.0' },
    timeout: 60000,
    ...options
  })
  return Buffer.from(res.data)
}

/** GET que devuelve JSON */
export async function getJson(url, options = {}) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) IzukuBot/1.0' },
    timeout: 60000,
    ...options
  })
  return res.data
}

/** Archivo temporal */
export function tmpFile(ext = 'tmp') {
  const dir = path.join(process.cwd(), 'tmp')
  fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`)
}

/** Convierte un buffer de imagen/video a webp (sticker) usando ffmpeg */
export async function toSticker(buffer, isVideo = false) {
  const input = tmpFile(isVideo ? 'mp4' : 'jpg')
  const output = tmpFile('webp')
  fs.writeFileSync(input, buffer)

  const filter =
    "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease," +
    "fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse"

  const cmd = isVideo
    ? `ffmpeg -y -i "${input}" -vcodec libwebp -vf "${filter}" -loop 0 -ss 0 -t 8 -preset default -an -vsync 0 -s 320:320 "${output}"`
    : `ffmpeg -y -i "${input}" -vcodec libwebp -vf "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease,format=rgba,pad=320:320:'(ow-iw)/2':'(oh-ih)/2':color=#00000000" -lossless 1 -q:v 70 "${output}"`

  await execAsync(cmd)
  const result = fs.readFileSync(output)
  try { fs.unlinkSync(input); fs.unlinkSync(output) } catch {}
  return result
}

/** Añade metadata (pack/autor) a un webp usando exiftool-less: EXIF manual */
export function addExif(webpBuffer, packname = 'Izuku Bot', author = 'Bot') {
  // Construye el bloque EXIF que WhatsApp usa para mostrar pack/autor
  const json = {
    'sticker-pack-id': 'com.izuku.bot',
    'sticker-pack-name': packname,
    'sticker-pack-publisher': author,
    emojis: ['🤖']
  }
  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ])
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8')
  const exif = Buffer.concat([exifAttr, jsonBuffer])
  exif.writeUIntLE(jsonBuffer.length, 14, 4)
  return { webp: webpBuffer, exif }
}

/** Informacion del sistema para el plugin de info */
export function systemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpu: os.cpus()[0]?.model || 'Desconocido',
    cores: os.cpus().length,
    totalMem: formatSize(os.totalmem()),
    freeMem: formatSize(os.freemem()),
    uptime: formatTime(os.uptime() * 1000),
    node: process.version
  }
}

/** Convierte un texto a "fuente bonita" para los menus */
export function style(text) {
  const normal = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const fancy = 'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴩqʀsᴛᴜᴠᴡxʏᴢABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return [...text].map((c) => {
    const i = normal.indexOf(c)
    return i === -1 ? c : fancy[i]
  }).join('')
}
