import axios from 'axios'

/**
 * Lista de APIs publicas de respaldo.
 * Si alguna deja de funcionar, edita/añade endpoints aqui
 * y todos los plugins de descargas se beneficiaran.
 */
const API = {
  youtube: (url, type) => [
    { url: `https://api.siputzx.my.id/api/d/ytmp${type === 'audio' ? '3' : '4'}`, params: { url }, pick: (d) => d?.data?.dl || d?.data?.url },
    { url: `https://api.dreaded.site/api/ytdl/${type === 'audio' ? 'audio' : 'video'}`, params: { url }, pick: (d) => d?.result?.url || d?.result?.download_url },
    { url: 'https://api.vreden.my.id/api/ytmp3', params: { url }, pick: (d) => d?.result?.download?.url }
  ],
  tiktok: (url) => [
    { url: 'https://api.siputzx.my.id/api/d/tiktok', params: { url }, pick: (d) => d?.data?.urls?.[0] || d?.data?.url },
    { url: 'https://tikwm.com/api/', params: { url }, pick: (d) => d?.data?.play && `https://tikwm.com${d.data.play}` },
    { url: 'https://api.dreaded.site/api/tiktok', params: { url }, pick: (d) => d?.tiktok?.video }
  ],
  instagram: (url) => [
    { url: 'https://api.siputzx.my.id/api/d/igdl', params: { url }, pick: (d) => d?.data?.[0]?.url },
    { url: 'https://api.dreaded.site/api/instagram', params: { url }, pick: (d) => d?.result?.[0]?.url }
  ],
  facebook: (url) => [
    { url: 'https://api.siputzx.my.id/api/d/facebook', params: { url }, pick: (d) => d?.data?.[0]?.url || d?.data?.hd },
    { url: 'https://api.dreaded.site/api/facebook', params: { url }, pick: (d) => d?.result?.hd || d?.result?.sd }
  ]
}

async function tryAll(list) {
  let lastError = 'Sin respuesta'
  for (const api of list) {
    try {
      const { data } = await axios.get(api.url, { params: api.params, timeout: 60000 })
      const link = api.pick(data)
      if (link) return link
    } catch (e) { lastError = e.message }
  }
  throw new Error(`Ninguna API respondió (${lastError}). Puedes añadir más endpoints en lib/downloader.js`)
}

export const ytdl = (url, type = 'video') => tryAll(API.youtube(url, type))
export const tiktokdl = (url) => tryAll(API.tiktok(url))
export const igdl = (url) => tryAll(API.instagram(url))
export const fbdl = (url) => tryAll(API.facebook(url))

/** Busqueda en YouTube sin dependencias externas (scraping del HTML) */
export async function ytSearch(query, limit = 5) {
  const { data } = await axios.get('https://www.youtube.com/results', {
    params: { search_query: query },
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 30000
  })
  const json = data.split('var ytInitialData = ')[1]?.split('};')[0] + '}'
  const parsed = JSON.parse(json)
  const items = parsed.contents.twoColumnSearchResultsRenderer.primaryContents
    .sectionListRenderer.contents[0].itemSectionRenderer.contents
  return items
    .filter((i) => i.videoRenderer)
    .slice(0, limit)
    .map((i) => {
      const v = i.videoRenderer
      return {
        title: v.title.runs[0].text,
        videoId: v.videoId,
        url: `https://youtu.be/${v.videoId}`,
        duration: v.lengthText?.simpleText || 'EN VIVO',
        views: v.viewCountText?.simpleText || '—',
        author: v.ownerText?.runs?.[0]?.text || '—',
        thumbnail: v.thumbnail.thumbnails.pop().url,
        published: v.publishedTimeText?.simpleText || '—'
      }
    })
}
