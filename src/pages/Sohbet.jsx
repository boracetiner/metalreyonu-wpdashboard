import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, getKonusma, getMesajlar, mesajGonder, getHazirYanitlar, konusmaGuncelle } from '../supabaseClient'

const SONUCLAR = [
  { key: 'satis',           label: '🛒 Satışa Dönüştü',          kapat: true  },
  { key: 'soru_cevaplandi', label: '💬 Soru Cevaplandı',          kapat: true  },
  { key: 'takip',           label: '🔄 Takipte',                  kapat: false },
  { key: 'siparis_cozuldu', label: '📦 Sipariş Takibi Çözüldü',   kapat: true  },
  { key: 'kayip',           label: '❌ Satış Kaybı',              kapat: false },
  { key: 'degisim_tamam',   label: '🔄 Değişim/İade Tamamlandı',  kapat: true  },
  { key: 'sikayet_islemde', label: '⚠️ Şikayet Alındı-İşlemde',   kapat: false },
  { key: 'kargo_cozuldu',   label: '🚚 Kargo Sorunu Çözüldü',     kapat: true  },
  { key: 'iade_cozuldu',    label: '✅ İade/Şikayet Çözüldü',     kapat: true  },
  { key: 'spam',            label: '🚫 İlgisiz/Spam',             kapat: true  },
]

export default function Sohbet({ profil }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [konusma, setKonusma]   = useState(null)
  const [mesajlar, setMesajlar] = useState([])
  const [metin, setMetin]       = useState('')
  const [notModu, setNotModu]   = useState(false)
  const [hazirYanitlar, setHazirYanitlar] = useState([])
  const [hazirOneri, setHazirOneri]       = useState([])
  const [sonucModal, setSonucModal]       = useState(false)
  const [yukleniyor, setYukleniyor]       = useState(true)
  const [gonderiyor, setGonderiyor]       = useState(false)
  const altRef = useRef(null)

  useEffect(() => {
    yukle()
    const channel = supabase
      .channel(`sohbet-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        payload => setMesajlar(prev => [...prev, payload.new])
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [id])

  useEffect(() => {
    altRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mesajlar])

  async function yukle() {
    const [k, m, hy] = await Promise.all([
      getKonusma(id),
      getMesajlar(id),
      getHazirYanitlar()
    ])
    setKonusma(k)
    setMesajlar(m)
    setHazirYanitlar(hy)
    setYukleniyor(false)
  }

  function metinDegistir(val) {
    setMetin(val)
    if (val.startsWith('/') && val.length > 1) {
      const q = val.slice(1).toLowerCase()
      setHazirOneri(hazirYanitlar.filter(h =>
        h.kisayol.includes(q) || h.baslik.toLowerCase().includes(q)
      ).slice(0, 5))
    } else {
      setHazirOneri([])
    }
  }

  async function gonder() {
    if (!metin.trim() || gonderiyor) return
    setGonderiyor(true)
    try {
      await mesajGonder({
        phone: konusma.contact_phone,
        message: metin,
        conversation_id: id,
        agent_id: profil?.id,
        is_note: notModu
      })
      setMetin('')
      setHazirOneri([])
    } catch (err) {
      alert('Mesaj gönderilemedi: ' + err.message)
    } finally {
      setGonderiyor(false)
    }
  }

  async function kapat(sonucKey) {
    const sonuc = SONUCLAR.find(s => s.key === sonucKey)
    await konusmaGuncelle(id, {
      sonuc: sonucKey,
      sonuc_guncellendi: new Date().toISOString(),
      sonuc_guncelleyen: profil?.id,
      status: sonuc?.kapat ? 'kapali' : 'beklemede'
    })
    setSonucModal(false)
    navigate('/inbox')
  }

  if (yukleniyor) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Yükleniyor...</div>
  if (!konusma) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Konuşma bulunamadı</div>

  const isim = konusma.contact_name || konusma.contact_phone || 'Bilinmiyor'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/inbox')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 18, padding: 4, display: 'flex' }}>←</button>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontWeight: 700, fontSize: 14 }}>
            {isim.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{isim}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{konusma.contact_phone} · {konusma.category?.replace(/_/g, ' ')}</div>
          </div>
        </div>
        <button
          onClick={() => setSonucModal(true)}
          style={{ padding: '8px 16px', borderRadius: 8, background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ✕ Kapat
        </button>
      </div>

      {/* Önceki sonuç uyarısı */}
      {konusma.onceki_sonuc && (
        <div style={{ background: '#fffbeb', borderBottom: '1px solid #fed7aa', padding: '8px 20px', fontSize: 12, color: '#92400e' }}>
          ⚠️ Bu müşteri daha önce <strong>{konusma.onceki_sonuc}</strong> olarak kapandı
        </div>
      )}

      {/* Mesajlar */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {mesajlar.map(m => {
          const giden  = m.direction === 'outbound'
          const not    = m.direction === 'note'
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: not ? 'center' : giden ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
              <div style={{
                maxWidth: '70%',
                padding: '10px 14px',
                borderRadius: not ? 8 : giden ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                background: not ? '#fffbeb' : giden ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#fff',
                color: not ? '#92400e' : giden ? '#fff' : '#111827',
                border: not ? '1px solid #fed7aa' : giden ? 'none' : '1px solid #e5e7eb',
                fontSize: 13,
                lineHeight: 1.5,
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
              }}>
                {not && <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, color: '#b45309' }}>🔒 DAHİLİ NOT</div>}
                <div>{m.message_text}</div>
                <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6, textAlign: 'right' }}>
                  {new Date(m.sent_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={altRef} />
      </div>

      {/* Yazma alanı */}
      <div style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px' }}>
        {/* Hazır yanıt önerileri */}
        {hazirOneri.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 8, overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            {hazirOneri.map(h => (
              <div
                key={h.id}
                onClick={() => { setMetin(h.icerik); setHazirOneri([]) }}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f9fafb', fontSize: 12 }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <span style={{ color: '#16a34a', fontWeight: 700 }}>/{h.kisayol}</span>
                <span style={{ color: '#6b7280', marginLeft: 8 }}>{h.baslik}</span>
              </div>
            ))}
          </div>
        )}

        {/* Mod göstergesi */}
        {notModu && (
          <div style={{ background: '#fffbeb', border: '1px solid #fed7aa', borderRadius: 6, padding: '6px 12px', marginBottom: 8, fontSize: 11, color: '#92400e', fontWeight: 600 }}>
            🔒 Not modu — müşteri görmez
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={metin}
            onChange={e => metinDegistir(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); gonder() } }}
            placeholder={notModu ? 'Dahili not yaz...' : 'Mesaj yaz... (/ ile hazır yanıt)'}
            rows={2}
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `1px solid ${notModu ? '#fed7aa' : '#e5e7eb'}`, fontSize: 13, fontFamily: 'inherit', resize: 'none', background: notModu ? '#fffbeb' : '#fff', color: '#111827' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => setNotModu(!notModu)}
              style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                background: notModu ? '#fffbeb' : '#fff',
                borderColor: notModu ? '#fed7aa' : '#e5e7eb',
                color: notModu ? '#92400e' : '#6b7280'
              }}
              title="Not modu"
            >🔒</button>
            <button
              onClick={gonder}
              disabled={!metin.trim() || gonderiyor}
              style={{ padding: '8px 14px', borderRadius: 7, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: (!metin.trim() || gonderiyor) ? 0.6 : 1 }}
            >{gonderiyor ? '...' : '↑'}</button>
          </div>
        </div>
      </div>

      {/* Sonuç Modal */}
      {sonucModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', marginBottom: 4 }}>Konuşmayı Kapat</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Bu konuşma için bir sonuç seçin</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SONUCLAR.map(s => (
                <button
                  key={s.key}
                  onClick={() => kapat(s.key)}
                  style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#111827', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#16a34a' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                >
                  {s.label}
                  <span style={{ float: 'right', fontSize: 11, color: s.kapat ? '#16a34a' : '#f59e0b' }}>{s.kapat ? 'Kapatır' : 'Beklemede'}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setSonucModal(false)}
              style={{ marginTop: 12, width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >İptal</button>
          </div>
        </div>
      )}
    </div>
  )
}
