import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jywohakixaodiyxilgsf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_2IXpyPDtiYyDMW-YaBPC-g_dQtUvq-7'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function getDailyStats(days = 15) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data } = await supabase
    .from('conversations')
    .select('created_at, status')
    .gte('created_at', since.toISOString())
  if (!data) return []
  const byDay = {}
  data.forEach(row => {
    const gun = new Date(row.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    if (!byDay[gun]) byDay[gun] = { gun, gelen: 0, cevaplanan: 0, cevapsiz: 0 }
    byDay[gun].gelen++
    if (row.status === 'responded' || row.status === 'closed') byDay[gun].cevaplanan++
    else byDay[gun].cevapsiz++
  })
  return Object.values(byDay)
}

export async function getKpiStats() {
  const bugun = new Date()
  bugun.setHours(0, 0, 0, 0)
  const bugunISO = bugun.toISOString()

  const { data: tumKonusmalar } = await supabase
    .from('conversations')
    .select('status, response_time_minutes')

  const { data: bugunKonusmalar } = await supabase
    .from('conversations')
    .select('id')
    .gte('created_at', bugunISO)

  const total = tumKonusmalar?.length || 0
  const cevaplanan = tumKonusmalar?.filter(c => c.status !== 'open').length || 0
  const bekleyen = tumKonusmalar?.filter(c => c.status === 'open').length || 0
  const ortSure = tumKonusmalar
    ?.filter(c => c.response_time_minutes)
    .reduce((acc, c, _, arr) => acc + c.response_time_minutes / arr.length, 0) || 0

  return {
    bugunGelen: bugunKonusmalar?.length || 0,
    yanıtOrani: total ? Math.round((cevaplanan / total) * 100) : 0,
    ortSure: Math.round(ortSure),
    bekleyen,
  }
}

export async function getKategoriler() {
  const { data } = await supabase.from('conversations').select('category')
  if (!data) return []
  const sayac = {}
  data.forEach(({ category }) => { sayac[category] = (sayac[category] || 0) + 1 })
  const renkler = {
    fiyat_sorgusu: '#2563EB', stok_sorgusu: '#0891B2',
    siparis_takibi: '#059669', iade_sikayet: '#D97706', diger: '#6B7280'
  }
  const etiketler = {
    fiyat_sorgusu: 'Fiyat Sorgusu', stok_sorgusu: 'Stok Sorgusu',
    siparis_takibi: 'Sipariş Takibi', iade_sikayet: 'İade / Şikayet', diger: 'Diğer'
  }
  const toplam = Object.values(sayac).reduce((a, b) => a + b, 0)
  return Object.entries(sayac).map(([key, val]) => ({
    name: etiketler[key] || key,
    value: Math.round((val / toplam) * 100),
    color: renkler[key] || '#6B7280'
  }))
}

export async function getBekleyenler() {
  const { data } = await supabase
    .from('conversations')
    .select('id, contact_name, contact_phone, category, last_message_at')
    .eq('status', 'open')
    .order('last_message_at', { ascending: true })
    .limit(20)
  if (!data) return []
  return data.map(row => {
    const bekleme = Date.now() - new Date(row.last_message_at).getTime()
    const saat = Math.floor(bekleme / 3600000)
    const dakika = Math.floor((bekleme % 3600000) / 60000)
    const sure = saat > 0 ? `${saat}s ${dakika}dk` : `${dakika}dk`
    const oncelik = saat >= 3 ? 'kritik' : saat >= 1 ? 'yuksek' : 'orta'
    return {
      id: row.id,
      musteri: row.contact_name || 'Bilinmiyor',
      telefon: row.contact_phone?.replace(/(\d{2})\d+(\d{3})/, '$1···$2'),
      sure, oncelik,
      kategori: row.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  })
}

export async function getTemsilciler() {
  const { data } = await supabase
    .from('conversations').select('assigned_agent, status, response_time_minutes')
  if (!data) return []
  const agents = {}
  data.forEach(row => {
    const ad = row.assigned_agent || 'Atanmamış'
    if (!agents[ad]) agents[ad] = { ad, atanan: 0, cevaplayan: 0, sureler: [] }
    agents[ad].atanan++
    if (row.status !== 'open') agents[ad].cevaplayan++
    if (row.response_time_minutes) agents[ad].sureler.push(row.response_time_minutes)
  })
  return Object.values(agents).map(a => ({
    ...a,
    ort_sure: a.sureler.length ? Math.round(a.sureler.reduce((s, v) => s + v, 0) / a.sureler.length) : null,
    oran: a.atanan ? Math.round((a.cevaplayan / a.atanan) * 100) : 0
  })).sort((a, b) => b.atanan - a.atanan)
}
