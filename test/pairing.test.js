// Pruebas de la verificacion del codigo de vinculacion (node --test test/)
import { EventEmitter } from 'events'
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatPairingCode, requestVerifiedPairingCode } from '../lib/pairing.js'

/** Socket falso: ws es un EventEmitter que recibe "frames" como los de Baileys. */
function fakeSock({ code = 'ABCD1234', onRequest }) {
  const ws = new EventEmitter()
  return {
    ws,
    requestPairingCode: async (phone) => {
      ws.phone = phone
      onRequest?.(ws)
      return code
    }
  }
}

const iq = (attrs, content) => ({ tag: 'iq', attrs: { from: 's.whatsapp.net', ...attrs }, content })

test('devuelve el codigo solo cuando WhatsApp responde con result', async () => {
  const sock = fakeSock({ onRequest: (ws) => setImmediate(() => ws.emit('frame', iq({ type: 'result', id: '1' }))) })
  const code = await requestVerifiedPairingCode(sock, '+598 96 719 709')
  assert.equal(code, 'ABCD1234')
  assert.equal(sock.ws.phone, '59896719709', 'el numero se envia solo con digitos')
  assert.equal(sock.ws.listenerCount('frame'), 0, 'se quita el listener al terminar')
})

test('NO devuelve codigo si WhatsApp rechaza la solicitud', async () => {
  const sock = fakeSock({
    onRequest: (ws) => setImmediate(() => ws.emit('frame', iq({ type: 'error', id: '1' }, [
      { tag: 'error', attrs: { code: '400', text: 'bad-request' } }
    ])))
  })
  await assert.rejects(
    () => requestVerifiedPairingCode(sock, '59896719709'),
    (e) => /rechazó/.test(e.message) && /400/.test(e.message) && /bad-request/.test(e.message)
  )
  assert.equal(sock.ws.listenerCount('frame'), 0)
})

test('NO devuelve codigo si WhatsApp no responde a tiempo', async () => {
  const sock = fakeSock({})
  await assert.rejects(
    () => requestVerifiedPairingCode(sock, '59896719709', 50),
    /no confirmó/
  )
})

test('ignora respuestas de otros remitentes o de tipo set', async () => {
  const sock = fakeSock({
    onRequest: (ws) => setImmediate(() => {
      ws.emit('frame', { tag: 'iq', attrs: { from: 'otro@s.whatsapp.net', type: 'result', id: 'x' } })
      ws.emit('frame', { tag: 'iq', attrs: { from: 's.whatsapp.net', type: 'set', id: 'y' } })
      ws.emit('frame', { tag: 'message', attrs: { from: 's.whatsapp.net' } })
    })
  })
  await assert.rejects(() => requestVerifiedPairingCode(sock, '59896719709', 50), /no confirmó/)
})

test('numero invalido: no envia nada a WhatsApp', async () => {
  let called = false
  const sock = fakeSock({ onRequest: () => { called = true } })
  await assert.rejects(() => requestVerifiedPairingCode(sock, '123'), /Número inválido/)
  assert.equal(called, false)
})

test('si el envio falla (conexion cerrada), el error se propaga y no hay codigo', async () => {
  const sock = {
    ws: new EventEmitter(),
    requestPairingCode: async () => { throw new Error('Connection Closed') }
  }
  await assert.rejects(() => requestVerifiedPairingCode(sock, '59896719709'), /Connection Closed/)
  assert.equal(sock.ws.listenerCount('frame'), 0)
})

test('formatPairingCode agrupa en bloques de 4', () => {
  assert.equal(formatPairingCode('ABCD1234'), 'ABCD-1234')
  assert.equal(formatPairingCode(''), '')
})
