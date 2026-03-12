import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getKonusmalar } from '../supabaseClient'

const DURUM_RENK = { open: '#16a34a', closed: '#6b7280', kapali: '#6b7280', beklemede: '#f59e0b' }
const DURUM_ETIKET = { open: 'Açık', closed: 'Kapalı', kapali: 'Kapalı', beklemede: 'Beklemede' }

export default function Inbox({ profil }) {
  const [konusmalar, setKonusmalar] = useState([])
  const [filtre, setFiltre]         = useState('open')
  const [arama, setArama]           = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    yukle()

    // Realtime
    const channel = supabase
      .channel('inbox-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => yukle())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => yukle())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [filtre])

  async function yukle() {
    setYukleniyor(true)
    const data = await getKonusmalar({ status: filtre === 'all' ? undefined : filtre })
    setKonusmalar(data)
    setYukleniyor(false)
  }

  const filtrelenmis = konusmalar.filter(k => {
    if (!arama) return true
    const q = arama.toLowerCase()
    return (
      k.contact_name?.toLowerCase().includes(q) ||
      k.contact_phone?.includes(q)
    )
  })

  function sureHesapla(tarih) {
    if (!tarih) return ''
    const fark = Date.now() - new Date(tarih).getTime()
    const dk = Math.floor(fark / 60000)
    const saat = Math.floor(dk / 60)
    const gun = Math.floor(saat / 24)
    if (gun > 0) return `${gun}g`
    if (saat > 0) return `${saat}s`
    return `${dk}dk`
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Inbox</h1>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{filtrelenmis.length} konuşma</div>
        </div>

        {/* Arama */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>🔍</span>
          <input
            value={arama}
            onChange={e => setArama(e.target.value)}
            placeholder="İsim veya telefon ara..."
            style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', color: '#111827' }}
          />
        </div>

        {/* Filtre sekmeleri */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['open','Açık'],['beklemede','Beklemede'],['closed','Kapalı'],['all','Tümü']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFiltre(val)}
              style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                background: filtre === val ? '#dcfce7' : '#fff',
                borderColor: filtre === val ? '#16a34a' : '#e5e7eb',
                color: filtre === val ? '#16a34a' : '#6b7280'
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {yukleniyor ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Yükleniyor...</div>
        ) : filtrelenmis.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Konuşma bulunamadı</div>
        ) : (
          filtrelenmis.map(k => {
            const isim = k.contact_name || k.contact_phone || 'Bilinmiyor'
            const sure = sureHesapla(k.last_message_at)
            const renk = DURUM_RENK[k.status] || '#6b7280'
            return (
              <div
                key={k.id}
                onClick={() => navigate(`/inbox/${k.id}`)}
                style={{ padding: '14px 20px', borderBottom: '1px solid #f9fafb', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                    {isim.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isim}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 8 }}>{sure}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {k.category?.replace(/_/g, ' ') || 'Kategori yok'}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: renk, background: `${renk}15`, padding: '1px 7px', borderRadius: 4, flexShrink: 0 }}>
                        {DURUM_ETIKET[k.status] || k.status}
                      </span>
                    </div>
                  </div>
                </div>
                {k.onceki_sonuc && (
                  <div style={{ marginTop: 6, marginLeft: 52, fontSize: 11, color: '#f59e0b', background: '#fffbeb', padding: '3px 8px', borderRadius: 4, border: '1px solid #fed7aa' }}>
                    ⚠️ Önceki konuşma: {k.onceki_sonuc}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
