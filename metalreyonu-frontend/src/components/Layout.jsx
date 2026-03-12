import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { cikisYap } from '../supabaseClient'
import Dashboard from '../pages/Dashboard'
import Inbox from '../pages/Inbox'
import Sohbet from '../pages/Sohbet'
import AtamaKuyrugu from '../pages/AtamaKuyrugu'
import TemsilciYonetimi from '../pages/TemsilciYonetimi'
import PerformansRaporu from '../pages/PerformansRaporu'
import KategoriYonetimi from '../pages/KategoriYonetimi'
import HazirYanitlar from '../pages/HazirYanitlar'
import MusteriProfili from '../pages/MusteriProfili'
import Profil from '../pages/Profil'

const MENU = [
  { path: '/',                 label: 'Dashboard',          icon: '📊', roller: ['super_admin','admin','temsilci'] },
  { path: '/inbox',            label: 'Inbox',              icon: '💬', roller: ['super_admin','admin','temsilci'] },
  { path: '/atama',            label: 'Atama Kuyruğu',      icon: '🔄', roller: ['super_admin','admin'] },
  { path: '/temsilciler',      label: 'Temsilciler',        icon: '👥', roller: ['super_admin','admin'] },
  { path: '/performans',       label: 'Performans',         icon: '📈', roller: ['super_admin','admin'] },
  { path: '/kategoriler',      label: 'Kategoriler',        icon: '🏷️', roller: ['super_admin','admin'] },
  { path: '/hazir-yanitlar',   label: 'Hazır Yanıtlar',     icon: '⚡', roller: ['super_admin','admin','temsilci'] },
  { path: '/profil',           label: 'Profil',             icon: '👤', roller: ['super_admin','admin','temsilci'] },
]

export default function Layout({ kullanici, profil }) {
  const navigate = useNavigate()
  const rol = profil?.rol || 'temsilci'

  async function handleCikis() {
    await cikisYap()
    navigate('/login')
  }

  const gorunenMenu = MENU.filter(m => m.roller.includes(rol))

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif', background: '#f8fafc' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8fafc; }
        .nav-link { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; text-decoration: none; color: #6b7280; font-size: 13px; font-weight: 500; transition: all 0.15s; }
        .nav-link:hover { background: #f3f4f6; color: #111827; }
        .nav-link.active { background: #dcfce7; color: #16a34a; font-weight: 600; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 220, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💬</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#111827' }}>Metal Reyonu</div>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>WhatsApp Yönetim</div>
            </div>
          </div>
        </div>

        {/* Menü */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {gorunenMenu.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className="nav-link"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Alt — kullanıcı bilgisi */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
              {profil?.ad?.charAt(0) || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profil?.ad} {profil?.soyad}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{rol === 'super_admin' ? 'Süper Admin' : rol === 'admin' ? 'Admin' : 'Temsilci'}</div>
            </div>
          </div>
          <button
            onClick={handleCikis}
            style={{ width: '100%', padding: '7px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* İçerik */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          <Route path="/"                 element={<Dashboard profil={profil} />} />
          <Route path="/inbox"            element={<Inbox profil={profil} />} />
          <Route path="/inbox/:id"        element={<Sohbet profil={profil} />} />
          <Route path="/atama"            element={<AtamaKuyrugu profil={profil} />} />
          <Route path="/temsilciler"      element={<TemsilciYonetimi profil={profil} />} />
          <Route path="/performans"       element={<PerformansRaporu profil={profil} />} />
          <Route path="/kategoriler"      element={<KategoriYonetimi profil={profil} />} />
          <Route path="/hazir-yanitlar"   element={<HazirYanitlar profil={profil} />} />
          <Route path="/musteri/:id"      element={<MusteriProfili profil={profil} />} />
          <Route path="/profil"           element={<Profil profil={profil} />} />
        </Routes>
      </div>
    </div>
  )
}
