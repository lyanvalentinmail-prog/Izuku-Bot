import fs from 'fs'
import path from 'path'

import config from '../config.js'
import { ValidationError } from './errors.js'

// Los ajustes que cambias desde el panel se guardan aqui y se aplican sobre
// config.js al arrancar. Asi sobreviven a reinicios y redeploys (si el
// directorio database/ esta en un disco persistente).
const SETTINGS_FILE = path.join(process.cwd(), 'database', 'settings.json')
const MEDIA_DIR = path.join(process.cwd(), 'media')

// ---------- Validadores ----------

const text = (name, { min = 0, max = 100 } = {}) => (v) => {
  if (typeof v !== 'string') throw new ValidationError(`${name}: debe ser texto.`)
  const t = v.trim()
  if (t.length < min) throw new ValidationError(`${name}: no puede estar vacío.`)
  if (t.length > max) throw new ValidationError(`${name}: máximo ${max} caracteres.`)
  return t
}

const bool = (name) => (v) => {
  if (typeof v !== 'boolean') throw new ValidationError(`${name}: debe ser sí o no.`)
  return v
}

const int = (name, min, max) => (v) => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ValidationError(`${name}: debe ser un número entero entre ${min} y ${max}.`)
  }
  return n
}

const fraction = (name) => (v) => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1) {
    throw new ValidationError(`${name}: debe ser un número entre 0 y 1 (ej: 0.45).`)
  }
  return n
}

const phoneList = (name) => (v) => {
  if (!Array.isArray(v)) throw new ValidationError(`${name}: debe ser una lista.`)
  const numbers = [...new Set(v.map((x) => String(x).replace(/\D/g, '')).filter(Boolean))]
  if (!numbers.length) throw new ValidationError(`${name}: agrega al menos un número.`)
  for (const n of numbers) {
    if (!/^\d{8,15}$/.test(n)) {
      throw new ValidationError(`${name}: "${n}" no es válido. Usa solo dígitos con código de país (8 a 15 cifras).`)
    }
  }
  if (numbers.length > 10) throw new ValidationError(`${name}: máximo 10 números.`)
  return numbers
}

const prefixList = (v) => {
  if (!Array.isArray(v)) throw new ValidationError('prefix: debe ser una lista.')
  const list = v.map((p) => String(p))
  if (!list.length) return ['']
  if (list.length > 8) throw new ValidationError('prefix: máximo 8 prefijos.')
  for (const p of list) {
    if (p.length > 3) throw new ValidationError(`prefix: "${p}" es demasiado largo (máximo 3 caracteres).`)
    if (/\s/.test(p)) throw new ValidationError(`prefix: "${p}" no puede tener espacios.`)
  }
  return [...new Set(list)]
}

const menuImage = (v) => {
  const t = text('menuImage', { max: 300 })(v)
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  // Solo se permiten archivos dentro de la carpeta media/ del proyecto
  const resolved = path.resolve(process.cwd(), t)
  if (!resolved.startsWith(MEDIA_DIR + path.sep)) {
    throw new ValidationError('menuImage: usa una URL http(s) o un archivo dentro de la carpeta media/.')
  }
  return t
}

const newsletter = text('newsletter', { max: 200 })

/** Campos editables desde el panel. Cada uno valida y normaliza su valor. */
const FIELDS = {
  botName: text('botName', { min: 1, max: 40 }),
  ownerName: text('ownerName', { min: 1, max: 40 }),
  owner: phoneList('owner'),
  prefix: prefixList,
  newsletter,
  menuImage,
  self: bool('self'),
  onlyGroups: bool('onlyGroups'),
  autoRead: bool('autoRead'),
  antiCall: bool('antiCall'),
  buttons: bool('buttons'),
  maxSubBots: int('maxSubBots', 0, 100),
  economy: (v) => {
    if (!v || typeof v !== 'object') throw new ValidationError('economy: formato inválido.')
    const e = {
      dailyReward: int('dailyReward', 0, 10_000_000)(v.dailyReward),
      workMin: int('workMin', 0, 10_000_000)(v.workMin),
      workMax: int('workMax', 0, 10_000_000)(v.workMax),
      robChance: fraction('robChance')(v.robChance)
    }
    if (e.workMin > e.workMax) throw new ValidationError('economy: el trabajo mínimo no puede ser mayor que el máximo.')
    return e
  }
}

export const EDITABLE_KEYS = Object.keys(FIELDS)

/** Valores actuales (ya aplicados) de los campos editables. */
export function currentSettings() {
  return {
    botName: config.botName,
    ownerName: config.ownerName,
    owner: [...config.owner],
    prefix: [...config.prefix],
    newsletter: config.newsletter,
    menuImage: config.menuImage || '',
    self: config.self,
    onlyGroups: config.onlyGroups,
    autoRead: config.autoRead,
    antiCall: config.antiCall,
    buttons: config.buttons,
    maxSubBots: config.maxSubBots,
    economy: { ...config.economy }
  }
}

function readFile() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return {}
    const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
    return data && typeof data === 'object' ? data : {}
  } catch (e) {
    console.error('[settings] No se pudo leer settings.json:', e.message)
    return {}
  }
}

function writeFile(data) {
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true })
  const tmp = `${SETTINGS_FILE}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, SETTINGS_FILE)
}

function apply(key, value) {
  if (key === 'economy') Object.assign(config.economy, value)
  else config[key] = value
}

/** Valida un conjunto parcial de ajustes y devuelve los valores normalizados. */
export function validateSettings(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new ValidationError('Se esperaba un objeto con los ajustes.')
  }
  const clean = {}
  for (const [key, value] of Object.entries(patch)) {
    if (!FIELDS[key]) throw new ValidationError(`"${key}" no es un ajuste editable.`)
    clean[key] = FIELDS[key](value)
  }
  return clean
}

/** Carga los ajustes guardados y los aplica sobre config.js. Llamar al arrancar. */
export function loadSettings() {
  const saved = readFile()
  let applied = 0
  for (const [key, value] of Object.entries(saved)) {
    if (!FIELDS[key]) continue
    try {
      apply(key, FIELDS[key](value))
      applied++
    } catch (e) {
      console.error(`[settings] Ignorado "${key}": ${e.message}`)
    }
  }
  if (applied) console.log(`[settings] ${applied} ajuste(s) del panel aplicados.`)
  return currentSettings()
}

/** Valida, aplica y guarda ajustes. Devuelve los ajustes actuales. */
export function updateSettings(patch) {
  const clean = validateSettings(patch)
  for (const [key, value] of Object.entries(clean)) apply(key, value)
  writeFile({ ...readFile(), ...clean })
  return currentSettings()
}

/** Guarda la imagen del banner (jpg o png) dentro de media/ y la activa en el menu. */
export function saveBanner(buffer, ext) {
  if (!['jpg', 'png'].includes(ext)) throw new ValidationError('El banner debe ser JPG o PNG.')
  fs.mkdirSync(MEDIA_DIR, { recursive: true })
  for (const other of ['jpg', 'png']) {
    if (other !== ext) fs.rmSync(path.join(MEDIA_DIR, `banner.${other}`), { force: true })
  }
  const file = path.join(MEDIA_DIR, `banner.${ext}`)
  fs.writeFileSync(`${file}.tmp`, buffer)
  fs.renameSync(`${file}.tmp`, file)
  const ref = `./media/banner.${ext}`
  updateSettings({ menuImage: ref })
  return ref
}

/** Quita el banner: el menu volvera a enviarse solo con texto. */
export function removeBanner() {
  for (const ext of ['jpg', 'png']) fs.rmSync(path.join(MEDIA_DIR, `banner.${ext}`), { force: true })
  updateSettings({ menuImage: '' })
}

/** Ruta local del banner actual (o null si el menu usa una URL o no tiene banner). */
export function localBannerPath() {
  const img = config.menuImage || ''
  if (!img || /^https?:\/\//i.test(img)) return null
  const resolved = path.resolve(process.cwd(), img)
  return fs.existsSync(resolved) ? resolved : null
}
