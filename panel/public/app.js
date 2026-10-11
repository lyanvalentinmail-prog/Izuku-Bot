// Panel de control de Izuku Bot. Sin dependencias ni paso de compilacion.
// Todo el texto que viene del servidor se inserta con textContent (nada de innerHTML).

const $ = (sel) => document.querySelector(sel)

/** Crea un elemento. children puede ser texto, nodos o arrays. */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue
    if (k === 'class') node.className = v
    else if (k === 'text') node.textContent = v
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v)
    else if (k === 'value') node.value = v
    else if (k === 'checked') node.checked = !!v
    else node.setAttribute(k, v === true ? '' : String(v))
  }
  for (const c of [].concat(children)) {
    if (c === undefined || c === null || c === false) continue
    node.append(c instanceof Node ? c : document.createTextNode(String(c)))
  }
  return node
}

async function api(path, { method = 'GET', body } = {}) {
  const opts = { method, credentials: 'same-origin', headers: {} }
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(path, opts)
  let data = {}
  try { data = await res.json() } catch {}
  if (!res.ok) {
    const err = new Error(data.error || `Error ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}

function toast(text, kind = 'ok') {
  const t = $('#toast')
  t.className = `toast ${kind}`
  t.textContent = text
  clearTimeout(toast.timer)
  toast.timer = setTimeout(() => t.classList.add('hidden'), 3800)
}

function setMsg(id, text = '', kind = '') {
  const node = $(id)
  node.className = `msg ${kind}`.trim()
  node.textContent = text
}

const LABELS = {
  idle: 'Sin vincular',
  connecting: 'Conectando…',
  qr: 'Esperando escaneo',
  code: 'Esperando código',
  connected: 'Conectado',
  error: 'Error'
}

const phoneOf = (jid = '') => jid.split('@')[0].split(':')[0]

// ---------- Sesion ----------

function showLogin(message = '') {
  $('#app').classList.add('hidden')
  $('#login').classList.remove('hidden')
  setMsg('#login-msg', message, message ? 'err' : '')
  $('#password').focus()
}

function showApp() {
  $('#login').classList.add('hidden')
  $('#app').classList.remove('hidden')
  startPolling()
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const btn = e.submitter || e.target.querySelector('button')
  btn.disabled = true
  setMsg('#login-msg', 'Entrando…')
  try {
    await api('/api/login', { method: 'POST', body: { password: $('#password').value } })
    $('#password').value = ''
    setMsg('#login-msg')
    await boot()
  } catch (err) {
    setMsg('#login-msg', err.message, 'err')
  } finally {
    btn.disabled = false
  }
})

$('#logout').addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' }).catch(() => {})
  stopPolling()
  showLogin()
})

async function boot() {
  let session
  try {
    session = await api('/api/session')
  } catch (err) {
    return showLogin(err.message)
  }
  if (!session.authenticated) {
    if (!session.passwordConfigured) {
      return showLogin('El panel no tiene contraseña. Define PANEL_PASSWORD en el servidor y reinicia el bot.')
    }
    return showLogin()
  }
  showApp()
  await refreshStatus()
  loadSettings()
  loadCommands()
}

// ---------- Estado y vinculacion ----------

let pollTimer = null
let lastLinkSignature = ''
let lastStatus = null

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(() => refreshStatus().catch(() => {}), 2000)
}

function stopPolling() {
  clearInterval(pollTimer)
  pollTimer = null
}

async function refreshStatus() {
  let data
  try {
    data = await api('/api/status')
  } catch (err) {
    if (err.status === 401) { stopPolling(); showLogin('Tu sesión expiró. Vuelve a entrar.') }
    return
  }
  lastStatus = data
  renderStatus(data)
}

function renderStatus({ connection: c, bot: b }) {
  $('#bot-name').textContent = b.name ? `· ${b.name}` : ''
  const pill = $('#conn-pill')
  pill.className = `pill ${c.status}`
  pill.textContent = LABELS[c.status] || c.status

  const stats = [
    ['Estado', LABELS[c.status] || c.status],
    ['Cuenta', c.user?.id ? `${c.user.name || 'Sin nombre'} (+${phoneOf(c.user.id)})` : '—'],
    ['Comandos', String(b.commands)],
    ['Usuarios', String(b.users)],
    ['Sub-bots', `${b.subbots} / ${b.maxSubBots}`],
    ['Versión', b.version],
    ['Activo', formatUptime(b.uptimeSec)]
  ]
  const dl = $('#stats')
  dl.replaceChildren(...stats.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })]))

  renderLink(c)
}

function formatUptime(sec) {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ')
}

/** Vuelve a dibujar la caja de vinculacion solo si cambio algo (asi no se borra lo que escribes). */
function renderLink(c) {
  const signature = JSON.stringify([c.status, c.method, c.qr, c.pairingCode, c.error, c.note, c.user?.id, c.phone])
  if (signature === lastLinkSignature) return
  lastLinkSignature = signature

  const box = $('#link-box')
  box.replaceChildren()

  if (c.status === 'connected') {
    box.append(el('div', { class: 'user-box' }, [
      el('span', { class: 'note', text: 'Cuenta vinculada' }),
      el('span', { class: 'big', text: c.user?.name || 'Sin nombre' }),
      el('span', { class: 'note', text: `+${phoneOf(c.user?.id)}` }),
      el('p', { class: 'note', text: 'El bot está en línea y respondiendo comandos.' })
    ]))
    box.append(el('div', { class: 'row gap' }, [
      el('button', { class: 'btn danger', text: 'Desvincular cuenta', onclick: unlinkAccount })
    ]))
    return
  }

  if (c.status === 'qr') {
    box.append(el('div', { class: 'qr-box' }, [
      c.qr ? el('img', { src: c.qr, alt: 'Código QR para vincular WhatsApp' }) : el('div', { class: 'spinner' }),
      el('p', { class: 'note', text: c.note })
    ]))
    box.append(el('div', { class: 'row gap' }, [
      el('button', { class: 'btn ghost', text: 'Cancelar', onclick: cancelLink })
    ]))
    return
  }

  if (c.status === 'code') {
    box.append(el('div', { class: 'code-box' }, [
      el('span', { class: 'note', text: 'Tu código de vinculación' }),
      el('div', { class: 'code-big', text: c.pairingCode }),
      el('p', { class: 'note', text: c.note }),
      el('button', { class: 'btn small', text: 'Copiar código', onclick: () => copyCode(c.pairingCode) })
    ]))
    box.append(el('div', { class: 'row gap' }, [
      el('button', { class: 'btn', text: 'Pedir otro código', onclick: () => relink(c.phone) }),
      el('button', { class: 'btn ghost', text: 'Cancelar', onclick: cancelLink })
    ]))
    return
  }

  if (c.status === 'connecting') {
    box.append(el('div', { class: 'code-box' }, [
      el('div', { class: 'spinner' }),
      el('p', { class: 'note', text: c.note || 'Conectando con WhatsApp…' })
    ]))
    box.append(el('div', { class: 'row gap' }, [
      el('button', { class: 'btn ghost', text: 'Cancelar', onclick: cancelLink })
    ]))
    return
  }

  // idle o error: formulario para vincular
  if (c.status === 'error') {
    box.append(el('div', { class: 'alert', text: `No se pudo completar la vinculación: ${c.error}` }))
  } else if (c.error) {
    box.append(el('div', { class: 'alert', text: c.error }))
  } else if (c.note) {
    box.append(el('p', { class: 'note', text: c.note }))
  }
  box.append(linkForm(c))
}

function linkForm(c) {
  let method = c.method === 'code' ? 'code' : 'qr'
  const phoneInput = el('input', {
    type: 'tel', inputmode: 'numeric', placeholder: 'Ej: 5215512345678',
    autocomplete: 'off', value: c.phone || '', id: 'link-phone'
  })
  const phoneField = el('div', { class: 'field', id: 'phone-field' }, [
    el('label', { for: 'link-phone', text: 'Tu número de WhatsApp (con código de país, sin +)' }),
    phoneInput,
    el('span', { class: 'help', text: 'Solo dígitos. Ej: 52 (México) + número, 598 (Uruguay) + número.' })
  ])

  const qrRadio = el('input', { type: 'radio', name: 'method', value: 'qr' })
  const codeRadio = el('input', { type: 'radio', name: 'method', value: 'code' })
  const qrLabel = el('label', { class: method === 'qr' ? 'on' : '' }, [qrRadio, 'Código QR'])
  const codeLabel = el('label', { class: method === 'code' ? 'on' : '' }, [codeRadio, 'Código de 8 dígitos'])
  qrRadio.checked = method === 'qr'
  codeRadio.checked = method === 'code'

  const applyMethod = () => {
    phoneField.classList.toggle('hidden', method !== 'code')
    qrLabel.classList.toggle('on', method === 'qr')
    codeLabel.classList.toggle('on', method === 'code')
  }
  qrRadio.addEventListener('change', () => { method = 'qr'; applyMethod() })
  codeRadio.addEventListener('change', () => { method = 'code'; applyMethod() })

  const submit = el('button', { class: 'btn primary', type: 'submit', text: 'Vincular cuenta' })
  const form = el('form', { class: 'link-form', onsubmit: async (e) => {
    e.preventDefault()
    submit.disabled = true
    setMsg('#link-msg', 'Iniciando vinculación…')
    try {
      await api('/api/link', { method: 'POST', body: { method, phone: phoneInput.value } })
      setMsg('#link-msg')
      lastLinkSignature = ''
      await refreshStatus()
    } catch (err) {
      setMsg('#link-msg', err.message, 'err')
    } finally {
      submit.disabled = false
    }
  } }, [
    el('div', { class: 'seg' }, [qrLabel, codeLabel]),
    phoneField,
    el('div', { class: 'row gap' }, [submit]),
    el('p', { class: 'note', text: 'Con QR: abre WhatsApp › Dispositivos vinculados › Vincular un dispositivo y escanea. Con código: WhatsApp › Dispositivos vinculados › Vincular con número de teléfono.' })
  ])
  applyMethod()
  return form
}

async function linkWith(method, phone) {
  setMsg('#link-msg', 'Iniciando vinculación…')
  try {
    await api('/api/link', { method: 'POST', body: { method, phone } })
    setMsg('#link-msg')
    lastLinkSignature = ''
    await refreshStatus()
  } catch (err) {
    setMsg('#link-msg', err.message, 'err')
    lastLinkSignature = ''
    await refreshStatus().catch(() => {})
  }
}

function relink(phone) {
  return linkWith('code', phone)
}

async function cancelLink() {
  try {
    await api('/api/link/cancel', { method: 'POST' })
    toast('Vinculación cancelada.')
  } catch (err) {
    toast(err.message, 'err')
  }
  lastLinkSignature = ''
  await refreshStatus().catch(() => {})
}

async function unlinkAccount() {
  if (!confirm('¿Desvincular esta cuenta de WhatsApp? El bot dejará de responder hasta que vuelvas a vincularla.')) return
  try {
    await api('/api/unlink', { method: 'POST' })
    toast('Cuenta desvinculada.')
  } catch (err) {
    toast(err.message, 'err')
  }
  lastLinkSignature = ''
  await refreshStatus().catch(() => {})
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code.replace(/-/g, ''))
    toast('Código copiado.')
  } catch {
    toast('No se pudo copiar. Selecciónalo y cópialo a mano.', 'err')
  }
}

// ---------- Pestanas ----------

document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b === btn))
    document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'))
    $(`#tab-${btn.dataset.tab}`).classList.remove('hidden')
    if (btn.dataset.tab === 'banner') loadBanner()
    if (btn.dataset.tab === 'comandos') loadCommands()
    if (btn.dataset.tab === 'ajustes') loadSettings()
  })
})

// ---------- Ajustes ----------

const FIELD_DEFS = [
  { section: 'Identidad' },
  { key: 'botName', label: 'Nombre del bot', type: 'text', help: 'Sale en el menú, el banner y los mensajes.' },
  { key: 'ownerName', label: 'Nombre del dueño', type: 'text', help: 'Aparece en el menú como creador.' },
  { key: 'owner', label: 'Números del dueño', type: 'text', span2: true, help: 'Separados por coma. Solo dígitos con código de país. Ej: 59896719709, 521234567890', list: true },
  { key: 'newsletter', label: 'Enlace del canal', type: 'text', span2: true, help: 'Se muestra en el menú y en "owner".' },
  { key: 'menuImage', label: 'Imagen del menú (URL o ruta)', type: 'text', span2: true, help: 'Vacío = el menú se envía solo con texto. Para subir una imagen usa la pestaña Banner.' },

  { section: 'Prefijos y modos' },
  { key: 'prefix', label: 'Prefijos', type: 'text', help: 'Separados por espacio. Ej: . ! / #  — Déjalo vacío para usar comandos sin prefijo.', list: 'space' },
  { key: 'self', label: 'Modo privado', type: 'bool', help: 'Solo responde al dueño.' },
  { key: 'onlyGroups', label: 'Solo grupos', type: 'bool', help: 'Ignora los chats privados (salvo el dueño).' },
  { key: 'autoRead', label: 'Marcar como leídos', type: 'bool', help: 'Marca cada mensaje recibido como leído.' },
  { key: 'antiCall', label: 'Rechazar llamadas', type: 'bool', help: 'Rechaza las llamadas automáticamente.' },
  { key: 'buttons', label: 'Botones nativos en el menú', type: 'bool', help: 'Casi nadie los ve hoy; déjalo apagado si no estás seguro.' },
  { key: 'maxSubBots', label: 'Máximo de sub-bots', type: 'number', min: 0, max: 100, help: 'Cada sub-bot consume RAM.' },

  { section: 'Economía' },
  { key: 'economy.dailyReward', label: 'Recompensa diaria', type: 'number', min: 0, max: 10000000 },
  { key: 'economy.workMin', label: 'Trabajo: mínimo', type: 'number', min: 0, max: 10000000 },
  { key: 'economy.workMax', label: 'Trabajo: máximo', type: 'number', min: 0, max: 10000000 },
  { key: 'economy.robChance', label: 'Probabilidad de robo (0 a 1)', type: 'number', min: 0, max: 1, step: '0.01', help: 'Ej: 0.45 = 45 % de éxito.' }
]

let settingsLoaded = null

function getPath(obj, key) {
  return key.split('.').reduce((o, k) => (o ? o[k] : undefined), obj)
}

async function loadSettings() {
  if (settingsLoaded && $('#settings-fields').childElementCount) return
  let data
  try {
    data = await api('/api/settings')
  } catch (err) {
    setMsg('#settings-msg', err.message, 'err')
    return
  }
  settingsLoaded = data.settings
  renderSettings(data.settings)
}

function renderSettings(s) {
  const fields = $('#settings-fields')
  fields.replaceChildren()
  for (const def of FIELD_DEFS) {
    if (def.section) {
      fields.append(el('div', { class: 'section-title', text: def.section }))
      continue
    }
    const value = getPath(s, def.key)
    const id = `f-${def.key.replace('.', '-')}`
    let input
    if (def.type === 'bool') {
      input = el('input', { type: 'checkbox', id, 'data-key': def.key })
      input.checked = !!value
      fields.append(el('label', { class: 'switch', for: id }, [
        el('span', {}, [def.label, el('span', { class: 'help', text: def.help || '' })]),
        input
      ]))
      continue
    }
    const shown = def.list === 'space' ? (value || []).filter(Boolean).join(' ')
      : def.list ? (value || []).join(', ')
      : value ?? ''
    input = el('input', {
      type: def.type === 'number' ? 'number' : 'text',
      id, 'data-key': def.key, value: shown,
      ...(def.type === 'number' ? { min: def.min, max: def.max, step: def.step || '1' } : {}),
      autocomplete: 'off'
    })
    fields.append(el('div', { class: `field${def.span2 ? ' span2' : ''}` }, [
      el('label', { for: id, text: def.label }),
      input,
      def.help ? el('span', { class: 'help', text: def.help }) : null
    ]))
  }
}

function collectSettings() {
  const out = { economy: {} }
  for (const def of FIELD_DEFS) {
    if (def.section) continue
    const input = document.querySelector(`[data-key="${def.key}"]`)
    if (!input) continue
    let v
    if (def.type === 'bool') v = input.checked
    else if (def.type === 'number') v = input.value === '' ? NaN : Number(input.value)
    else if (def.list === 'space') v = input.value.trim().split(/\s+/).filter((x) => x !== '')
    else if (def.list) v = input.value.split(/[\s,]+/).filter(Boolean)
    else v = input.value.trim()

    if (def.key.startsWith('economy.')) out.economy[def.key.split('.')[1]] = v
    else out[def.key] = v
  }
  if (!out.prefix.length) out.prefix = ['']
  return out
}

$('#settings-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const btn = e.target.querySelector('button[type=submit]')
  btn.disabled = true
  setMsg('#settings-msg', 'Guardando…')
  try {
    const data = await api('/api/settings', { method: 'PUT', body: collectSettings() })
    settingsLoaded = data.settings
    renderSettings(data.settings)
    setMsg('#settings-msg', 'Cambios guardados. Ya están activos.', 'ok')
    toast('Ajustes guardados.')
    refreshStatus().catch(() => {})
  } catch (err) {
    setMsg('#settings-msg', err.message, 'err')
    toast(err.message, 'err')
  } finally {
    btn.disabled = false
  }
})

// ---------- Banner ----------

const MAX_BANNER = 8 * 1024 * 1024

async function loadBanner() {
  let s = settingsLoaded
  if (!s) {
    const data = await api('/api/settings').catch(() => null)
    s = settingsLoaded = data?.settings || {}
  }
  const preview = $('#banner-preview')
  preview.replaceChildren()
  $('#banner-cmd').textContent = `${(s.prefix || ['.'])[0] || ''}menu`
  $('#banner-remove').disabled = !s.menuImage

  if (!s.menuImage) {
    preview.append(el('p', { class: 'muted', text: 'Sin banner: el menú se envía solo con texto.' }))
    $('#banner-info').textContent = ''
  } else if (/^https?:\/\//i.test(s.menuImage)) {
    preview.append(el('img', { src: s.menuImage, alt: 'Banner del menú' }))
    $('#banner-info').textContent = `Usando una URL: ${s.menuImage}`
  } else {
    preview.append(el('img', { src: `/api/banner?t=${Date.now()}`, alt: 'Banner del menú' }))
    $('#banner-info').textContent = `Archivo local: ${s.menuImage}`
  }
}

$('#banner-file').addEventListener('change', (e) => {
  const file = e.target.files[0]
  $('#banner-upload').disabled = !file
  setMsg('#banner-msg')
  if (file && file.size > MAX_BANNER) {
    setMsg('#banner-msg', 'La imagen es muy pesada (máximo 8 MB).', 'err')
    $('#banner-upload').disabled = true
  }
})

$('#banner-upload').addEventListener('click', () => {
  const file = $('#banner-file').files[0]
  if (!file) return
  const btn = $('#banner-upload')
  btn.disabled = true
  setMsg('#banner-msg', 'Subiendo…')
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const data = await api('/api/banner', { method: 'POST', body: { data: reader.result } })
      settingsLoaded = data.settings
      $('#banner-file').value = ''
      setMsg('#banner-msg', 'Banner actualizado. Prueba con el comando menú.', 'ok')
      toast('Banner actualizado.')
      await loadBanner()
    } catch (err) {
      setMsg('#banner-msg', err.message, 'err')
      btn.disabled = false
    }
  }
  reader.onerror = () => { setMsg('#banner-msg', 'No se pudo leer el archivo.', 'err'); btn.disabled = false }
  reader.readAsDataURL(file)
})

$('#banner-remove').addEventListener('click', async () => {
  if (!confirm('¿Quitar el banner? El menú se enviará solo con texto.')) return
  try {
    const data = await api('/api/banner/remove', { method: 'POST' })
    settingsLoaded = data.settings
    setMsg('#banner-msg', 'Banner quitado.', 'ok')
    await loadBanner()
  } catch (err) {
    setMsg('#banner-msg', err.message, 'err')
  }
})

// ---------- Comandos ----------

let commandsData = null
const BADGES = [
  ['owner', '👑 Dueño'], ['rowner', '👑 Dueño principal'], ['admin', '🛡️ Admin del grupo'],
  ['botAdmin', '🤖 Bot admin'], ['group', '👥 Solo grupos'], ['private', '💬 Solo privado'],
  ['register', '📝 Registrado'], ['hidden', '🙈 Oculto']
]

let commandsUiReady = false

async function loadCommands(force = false) {
  if (!commandsData || force) {
    try { commandsData = await api('/api/commands') } catch (err) { toast(err.message, 'err'); return }
  }
  if (!commandsUiReady) {
    commandsUiReady = true
    $('#cmd-category').addEventListener('change', renderCommands)
    $('#cmd-search').addEventListener('input', renderCommands)
  }
  const select = $('#cmd-category')
  const previous = select.value
  const cats = [...new Set(commandsData.commands.map((c) => c.category))].sort()
  select.replaceChildren(el('option', { value: '', text: 'Todas las categorías' }))
  for (const c of cats) select.append(el('option', { value: c, text: c }))
  select.value = cats.includes(previous) ? previous : ''
  renderCommands()
}

function renderCommands() {
  if (!commandsData) return
  const q = $('#cmd-search').value.trim().toLowerCase()
  const cat = $('#cmd-category').value
  const prefix = (commandsData.prefix || [''])[0] || ''
  const list = commandsData.commands.filter((c) => {
    if (cat && c.category !== cat) return false
    if (!q) return true
    return c.commands.some((x) => x.includes(q)) || c.desc.toLowerCase().includes(q) || c.category.includes(q)
  })
  $('#cmd-count').textContent = `(${list.length} de ${commandsData.total})`

  const wrap = $('#cmd-list')
  wrap.replaceChildren()
  if (!list.length) {
    wrap.append(el('p', { class: 'muted', text: 'Ningún comando coincide con la búsqueda.' }))
    return
  }
  for (const c of list) {
    const badges = BADGES.filter(([k]) => c[k]).map(([, label]) => el('span', { class: 'badge', text: label }))
    wrap.append(el('div', { class: 'cmd' }, [
      el('div', { class: 'cmd-head' }, [
        el('span', { class: 'cmd-name', text: `${prefix}${c.commands[0]}` }),
        c.commands.length > 1 ? el('span', { class: 'cmd-alias', text: c.commands.slice(1).map((x) => `${prefix}${x}`).join('  ') }) : null,
        el('span', { class: 'cmd-cat', text: c.category })
      ]),
      el('div', { class: 'cmd-desc', text: c.desc || 'Sin descripción' }),
      badges.length ? el('div', { class: 'badges' }, badges) : null
    ]))
  }
}

$('#cmd-reload').addEventListener('click', async () => {
  try {
    commandsData = await api('/api/commands/reload', { method: 'POST' })
    loadCommands()
    toast(`Comandos recargados: ${commandsData.total}.`)
  } catch (err) {
    toast(err.message, 'err')
  }
})

boot()
