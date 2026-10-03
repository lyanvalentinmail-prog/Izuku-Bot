import NodeCache from 'node-cache'

/**
 * Cache de metadata de grupos.
 * Evita pedirle la info del grupo a WhatsApp en CADA mensaje:
 * es la optimizacion que mas acelera el bot en grupos grandes.
 * TTL de 5 minutos, y se invalida sola cuando el grupo cambia.
 */
export const groupCache = new NodeCache({ stdTTL: 300, useClones: false, checkperiod: 120 })

/** Cache generico para respuestas de APIs (busquedas, anime, etc.) */
export const apiCache = new NodeCache({ stdTTL: 600, useClones: false, checkperiod: 180 })
