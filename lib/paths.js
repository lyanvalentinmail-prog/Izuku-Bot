// ===============================================
//  RUTAS DE DATOS
//  Todo lo que hay que guardar (sesión, sub-bots, base
//  de datos, temporales) pasa por aquí, para que puedas
//  cambiar dónde se guarda sin tocar el resto del bot.
//
//  Es lo que hace posible desplegar en Render, Railway,
//  Docker o un VPS sin perder la sesión de WhatsApp:
//  si montas un disco persistente, solo hay que apuntar
//  DATA_DIR a la carpeta del disco (ej: /data).
//
//  Variables de entorno (todas opcionales):
//    DATA_DIR      -> carpeta base de datos (default: el proyecto)
//    SESSION_DIR   -> carpeta de la sesión del bot principal
//    SUBBOTS_DIR   -> carpeta de sesiones de los sub-bots
//    DATABASE_DIR  -> carpeta de database.json / settings.json
//    TMP_DIR       -> carpeta de archivos temporales
// ===============================================

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

/** Carpeta base para datos persistentes */
export const DATA_DIR = path.resolve(process.env.DATA_DIR || ROOT)

/** Sesión del bot principal (creds.json vive acá) */
export const SESSIONS_DIR = path.resolve(process.env.SESSION_DIR || process.env.SESSIONS_DIR || path.join(DATA_DIR, 'sessions'))

/** Sesiones de los sub-bots */
export const SUBBOTS_DIR = path.resolve(process.env.SUBBOTS_DIR || path.join(DATA_DIR, 'subbots'))

/** Base de datos y ajustes del panel */
export const DATABASE_DIR = path.resolve(process.env.DATABASE_DIR || path.join(DATA_DIR, 'database'))
export const DATABASE_FILE = path.join(DATABASE_DIR, 'database.json')
export const SETTINGS_FILE = path.join(DATABASE_DIR, 'settings.json')

/** Temporales (se limpian solos) */
export const TEMP_DIR = path.resolve(process.env.TMP_DIR || path.join(DATA_DIR, 'tmp'))

/** Carpeta de imagen del menú (banner) */
export const MEDIA_DIR = path.join(ROOT, 'media')
export const BANNER_FILE = path.join(MEDIA_DIR, 'banner.jpg')

/** Plugins (siempre viven en el proyecto, no en el disco de datos) */
export const PLUGINS_DIR = path.join(ROOT, 'plugins')

/** Crea todas las carpetas necesarias de una sola vez */
export function ensureDirs() {
  for (const dir of [DATA_DIR, SESSIONS_DIR, SUBBOTS_DIR, DATABASE_DIR, TEMP_DIR, MEDIA_DIR]) {
    try { fs.mkdirSync(dir, { recursive: true }) } catch {}
  }
}

/** ¿La sesión del bot principal ya está vinculada? */
export function isRegistered(dir = SESSIONS_DIR) {
  try { return fs.existsSync(path.join(dir, 'creds.json')) } catch { return false }
}

/** Borra una carpeta completa sin romper nada si no existe */
export function wipeDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }) } catch {}
}
