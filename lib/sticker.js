import fs from 'fs'
import webp from 'node-webpmux'
import config from '../config.js'
import { toSticker, tmpFile } from './functions.js'

/**
 * Escribe la metadata (pack y autor) dentro de un webp.
 * Es lo que WhatsApp muestra al tocar "Información del sticker".
 */
export async function writeExif(webpBuffer, packname, author) {
  const img = new webp.Image()
  await img.load(webpBuffer)

  const json = {
    'sticker-pack-id': 'com.izuku.bot',
    'sticker-pack-name': packname ?? config.botName,
    'sticker-pack-publisher': author ?? config.ownerName,
    emojis: ['🤖']
  }

  const head = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ])
  const payload = Buffer.from(JSON.stringify(json), 'utf-8')
  const exif = Buffer.concat([head, payload])
  exif.writeUIntLE(payload.length, 14, 4)

  img.exif = exif
  return await img.save(null)
}

/**
 * Crea un sticker completo (conversion + metadata).
 * @param {Buffer} buffer imagen o video
 * @param {boolean} isVideo
 * @param {string} packname
 * @param {string} author
 */
export async function createSticker(buffer, isVideo = false, packname, author) {
  const webpBuffer = await toSticker(buffer, isVideo)
  try {
    return await writeExif(webpBuffer, packname, author)
  } catch {
    // Si falla la metadata, al menos devolvemos el sticker
    return webpBuffer
  }
}
