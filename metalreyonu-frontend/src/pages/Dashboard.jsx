import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getKpiStats, getDailyStats, getKategoriDagilim, getKonusmalar } from '../supabaseClient'

const KpiKart = ({ baslik, deger, alt, renk, icon }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: -15, right: -15, width: 70, height: 70, borderRadius: '50%', background: renk, opacity: 0.08 }} />
    <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
    <div style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{baslik}</div>
    <div style={{ color: '#111827', fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>{deger}</div>
    {alt && <div style={{ color: renk, fontSize: 12, marginTop: 4, fontWeight: 500 }}>{alt}</div>}
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
      <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>{p.name}: {p.value}</p>)}
    </div>
  )
}

export default function Dashboard({ profil }) {
  const [kpi, setKpi]             = useState({ bugunGelen: 0, haftaGelen: 0, bekleyen: 0, kapanan: 0, satis: 0, kapanmaOrani: 0 })
  const [gunluk, setGunluk]       = useState([])
  const [kategoriler, setKategoriler] = useState([])
  const [bekleyenler, setBekleyenler] = useState([])
  const [yukleniyor, setYukleniyor]   = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function yukle() {
      const [k, g, kat, bek] = await Promise.all([
        getKpiStats(),
        getDailyStats(15),
        getKategoriDagilim(),
        getKonusmalar({ status: 'open', limit: 5 })
      ])
      setKpi(k)
      setGunluk(g)
      setKategoriler(kat)
      setBekleyenler(bek)
      setYukleniyor(false)
    }
    yukle()
  }, [])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 2 }}>Genel Bakış</h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>Hoş geldin, {profil?.ad} · Son 15 günlük veriler</p>
      </div>

      {/* KPI'lar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KpiKart baslik="Bugün Gelen"    deger={kpi.bugunGelen}        alt="yeni konuşma"         renk="#16a34a" icon="💬" />
        <KpiKart baslik="Bu Hafta"       deger={kpi.haftaGelen}        alt="toplam konuşma"        renk="#0891b2" icon="📅" />
        <KpiKart baslik="Bekleyen"       deger={kpi.bekleyen}          alt="yanıt bekliyor"        renk="#ef4444" icon="⏳" />
        <KpiKart baslik="Kapanma Oranı"  deger={`%${kpi.kapanmaOrani}`} alt={`${kpi.satis} satış`} renk="#f59e0b" icon="✅" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Trend */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>Günlük Konuşma Trendi</div>
          <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 20 }}>Gelen · Kapanan · Satış</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={gunluk}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="gun" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="gelen"   name="Gelen"   stroke="#16a34a" strokeWidth={2} fill="url(#g1)" />
              <Area type="monotone" dataKey="kapanan" name="Kapanan" stroke="#0891b2" strokeWidth={1.5} fill="none" />
              <Area type="monotone" dataKey="satis"   name="Satış"   stroke="#f59e0b" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Kategori */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>Kategori Dağılımı</div>
          <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 16 }}>Konuşma türleri</div>
          {kategoriler.length === 0 ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Henüz veri yok</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={kategoriler} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {kategoriler.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`%${v}`, '']} contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {kategoriler.map((k, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: k.color }} />
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{k.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: k.color }}>%{k.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Son bekleyenler */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Bekleyen Konuşmalar</div>
            <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>En son bekleyenler</div>
          </div>
          <button onClick={() => navigate('/inbox')} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: '#16a34a', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Tümünü Gör →
          </button>
        </div>
        {bekleyenler.length === 0 ? (
          <div style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>🎉 Bekleyen konuşma yok</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bekleyenler.map(b => {
              const bekleme = Date.now() - new Date(b.last_message_at).getTime()
              const saat = Math.floor(bekleme / 3600000)
              const dk = Math.floor((bekleme % 3600000) / 60000)
              const sure = saat > 0 ? `${saat}s ${dk}dk` : `${dk}dk`
              const kritik = saat >= 3
              return (
                <div
                  key={b.id}
                  onClick={() => navigate(`/inbox/${b.id}`)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 8, border: `1px solid ${kritik ? '#fecaca' : '#f3f4f6'}`, background: kritik ? '#fff7f7' : '#fafafa', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontWeight: 700, fontSize: 14 }}>
                      {(b.contact_name || b.contact_phone || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{b.contact_name || b.contact_phone}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{b.category?.replace(/_/g, ' ')}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: kritik ? '#ef4444' : '#6b7280' }}>{sure}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
