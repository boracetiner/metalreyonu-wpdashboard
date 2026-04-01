import { useState, useEffect } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  supabase, girisYap, cikisYap,
  getDailyStats, getKpiStats, getKategoriDagilim,
  getKonusmalar, getMesajlar, mesajGonder, konusmaGuncelle,
  getHazirYanitlar, getTemsilciler, profilGuncelle, getKategoriler
} from "./supabaseClient";

// ── SES BİLDİRİMİ ────────────────────────────────────────────────────────
function sesCaldir() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notalar = [
      { frekans: 880,  baslangic: 0,    sure: 0.12 },
      { frekans: 1320, baslangic: 0.13, sure: 0.18 }
    ];
    notalar.forEach(({ frekans, baslangic, sure }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = frekans;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, ctx.currentTime + baslangic);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + baslangic + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + baslangic + sure);
      osc.start(ctx.currentTime + baslangic);
      osc.stop(ctx.currentTime + baslangic + sure);
    });
  } catch(e) {}
}

const SONUCLAR = [
  { key: "satis",           label: "🛒 Satışa Dönüştü",         kapat: true  },
  { key: "soru_cevaplandi", label: "💬 Soru Cevaplandı",         kapat: true  },
  { key: "takip",           label: "🔄 Takipte",                 kapat: false },
  { key: "siparis_cozuldu", label: "📦 Sipariş Takibi Çözüldü",  kapat: true  },
  { key: "kayip",           label: "❌ Satış Kaybı",             kapat: false },
  { key: "degisim_tamam",   label: "🔄 Değişim/İade Tamamlandı", kapat: true  },
  { key: "sikayet_islemde", label: "⚠️ Şikayet Alındı-İşlemde",  kapat: false },
  { key: "kargo_cozuldu",   label: "🚚 Kargo Sorunu Çözüldü",    kapat: true  },
  { key: "iade_cozuldu",    label: "✅ İade/Şikayet Çözüldü",    kapat: true  },
  { key: "spam",            label: "🚫 İlgisiz/Spam",            kapat: true  },
];

const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #111827; }
  input, textarea, select, button { font-family: 'Plus Jakarta Sans', sans-serif; }
  @keyframes spin { to { transform: rotate(360deg) } }
`;

// ── LOGIN ──────────────────────────────────────────────────────────────────
function Login() {
  const [email, setEmail]   = useState("");
  const [sifre, setSifre]   = useState("");
  const [hata, setHata]     = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  async function handleGiris(e) {
    e.preventDefault();
    setHata(""); setYukleniyor(true);
    try { await girisYap(email, sifre); }
    catch { setHata("E-posta veya şifre hatalı."); setYukleniyor(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#16a34a,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px" }}>💬</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Metal Reyonu</h1>
          <p style={{ fontSize: 13, color: "#6b7280" }}>WhatsApp Yönetim Paneli</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {hata && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>{hata}</div>}
          <form onSubmit={handleGiris}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>E-posta</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Şifre</label>
              <input type="password" value={sifre} onChange={e => setSifre(e.target.value)} required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }} />
            </div>
            <button type="submit" disabled={yukleniyor}
              style={{ width: "100%", padding: 11, borderRadius: 8, background: "#16a34a", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", opacity: yukleniyor ? 0.7 : 1 }}>
              {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── SOHBET ─────────────────────────────────────────────────────────────────
function Sohbet({ konusmaId, profil, onGeri }) {
  const [konusma, setKonusma]     = useState(null);
  const [mesajlar, setMesajlar]   = useState([]);
  const [metin, setMetin]         = useState("");
  const [notModu, setNotModu]     = useState(false);
  const [hazirYanitlar, setHazirYanitlar] = useState([]);
  const [hazirOneri, setHazirOneri]       = useState([]);
  const [sonucModal, setSonucModal]       = useState(false);
  const [gonderiyor, setGonderiyor]       = useState(false);
  const [siparisNo, setSiparisNo]         = useState("");
  const [faturaNo, setFaturaNo]           = useState("");
  const [satisForm, setSatisForm]         = useState(false);

  useEffect(() => {
    yukle();
    // Realtime yerine polling - 3 saniyede bir kontrol
    let lastMsgId = null;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", konusmaId)
        .order("sent_at", { ascending: false })
        .limit(1);
      if (data?.[0] && data[0].id !== lastMsgId) {
        lastMsgId = data[0].id;
        setMesajlar(prev => {
          // Zaten varsa ekleme
          if (prev.find(m => m.id === data[0].id)) return prev;
          // Geçici mesajı değiştir
          const geciciVar = prev.find(m => m.id?.startsWith("gecici-") && m.message_text === data[0].message_text);
          if (geciciVar) return prev.map(m => m.id === geciciVar.id ? data[0] : m);
          // Yeni inbound mesajsa ses çal
          if (data[0].direction === "inbound") sesCaldir();
          return [...prev, data[0]];
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [konusmaId]);

  async function yukle() {
    const [{ data: k }, m, hy] = await Promise.all([
      supabase.from("conversations").select("*").eq("id", konusmaId).single(),
      getMesajlar(konusmaId),
      getHazirYanitlar()
    ]);
    setKonusma(k); setMesajlar(m); setHazirYanitlar(hy);
  }

  function metinDegistir(val) {
    setMetin(val);
    if (val.startsWith("/") && val.length > 1) {
      const q = val.slice(1).toLowerCase();
      setHazirOneri(hazirYanitlar.filter(h => h.kisayol?.includes(q) || h.baslik?.toLowerCase().includes(q)).slice(0, 5));
    } else setHazirOneri([]);
  }

  async function gonder() {
    if (!metin.trim() || gonderiyor) return;
    setGonderiyor(true);
    const metinKopya = metin;
    const notModuKopya = notModu;
    setMetin(""); setHazirOneri([]);
    const gecici = {
      id: "gecici-" + Date.now(),
      direction: notModuKopya ? "note" : "outbound",
      message_text: metinKopya,
      sent_at: new Date().toISOString()
    };
    setMesajlar(prev => [...prev, gecici]);
    try {
      await mesajGonder({ phone: konusma.contact_phone, message: metinKopya, conversation_id: konusmaId, agent_id: profil?.id, is_note: notModuKopya });
    } catch (err) {
      setMesajlar(prev => prev.filter(m => m.id !== gecici.id));
      alert("Hata: " + err.message);
    }
    finally { setGonderiyor(false); }
  }

  async function kapat(sonucKey) {
    if (sonucKey === "satis" && !satisForm) { setSatisForm(true); return; }
    const s = SONUCLAR.find(x => x.key === sonucKey);
    try {
      const { error } = await supabase.from("conversations").update({
        sonuc: sonucKey,
        sonuc_guncellendi: new Date().toISOString(),
        sonuc_guncelleyen: profil?.id,
        status: s?.kapat ? "kapali" : "beklemede",
        ...(sonucKey === "satis" && { siparis_no: siparisNo, fatura_no: faturaNo })
      }).eq("id", konusmaId);
      if (error) { alert("Hata: " + error.message); return; }
      setSonucModal(false); setSatisForm(false); setSiparisNo(""); setFaturaNo(""); onGeri();
    } catch(e) { alert("Hata: " + e.message); }
  }

  if (!konusma) return <div style={{ textAlign: "center", padding: 40, color: "#e5e7eb", fontSize: 13 }}>―</div>;
  const isim = konusma.contact_name || konusma.contact_phone || "Bilinmiyor";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onGeri} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280", padding: "4px 8px" }}>←</button>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", fontWeight: 700 }}>
            {isim.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{isim}</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{konusma.contact_phone} · {konusma.category?.replace(/_/g, " ")}</div>
          </div>
        </div>
        {konusma.assigned_agent ? (
          <button onClick={() => setSonucModal(true)}
            style={{ padding: "8px 16px", borderRadius: 8, background: "#16a34a", color: "#fff", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
            ✕ Kapat
          </button>
        ) : (
          <div style={{ fontSize: 12, color: "#f59e0b", background: "#fffbeb", border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 14px", fontWeight: 600 }}>
            ⚠️ Önce temsilci atanmalı
          </div>
        )}
      </div>

      {konusma.onceki_sonuc && (
        <div style={{ background: "#fffbeb", borderBottom: "1px solid #fed7aa", padding: "8px 20px", fontSize: 12, color: "#92400e" }}>
          ⚠️ Bu müşteri daha önce <strong>{konusma.onceki_sonuc}</strong> olarak kapandı
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: 20, background: "#f8fafc" }}>
        {mesajlar.map(m => {
          const giden = m.direction === "outbound", not = m.direction === "note";
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: not ? "center" : giden ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <div style={{ maxWidth: "70%", padding: "10px 14px",
                borderRadius: not ? 8 : giden ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                background: not ? "#fffbeb" : giden ? "linear-gradient(135deg,#16a34a,#15803d)" : "#fff",
                color: not ? "#92400e" : giden ? "#fff" : "#111827",
                border: not ? "1px solid #fed7aa" : giden ? "none" : "1px solid #e5e7eb",
                fontSize: 13, lineHeight: 1.5 }}>
                {not && <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>🔒 DAHİLİ NOT</div>}
                <div>{m.message_text}</div>
                <div style={{ fontSize: 10, marginTop: 4, opacity: 0.5, textAlign: "right" }}>
                  {new Date(m.sent_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "12px 16px" }}>
        {hazirOneri.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 8, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            {hazirOneri.map(h => (
              <div key={h.id} onClick={() => { setMetin(h.icerik); setHazirOneri([]); }}
                style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f9fafb", fontSize: 12, color: "#374151" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                <span style={{ color: "#16a34a", fontWeight: 700 }}>/{h.kisayol}</span>
                <span style={{ color: "#6b7280", marginLeft: 8 }}>{h.baslik}</span>
              </div>
            ))}
          </div>
        )}
        {notModu && <div style={{ background: "#fffbeb", border: "1px solid #fed7aa", borderRadius: 6, padding: "6px 12px", marginBottom: 8, fontSize: 11, color: "#92400e", fontWeight: 600 }}>🔒 Not modu — müşteri görmez</div>}
        {!konusma.assigned_agent ? (
          <div style={{ padding: "12px 16px", background: "#fffbeb", border: "1px solid #fed7aa", borderRadius: 8, fontSize: 13, color: "#92400e", textAlign: "center" }}>
            ⚠️ Cevap yazabilmek için önce bu sohbeti üstlenin veya bir temsilci atanmalı
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea value={metin} onChange={e => metinDegistir(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); gonder(); } }}
              placeholder={notModu ? "Dahili not yaz..." : "Mesaj yaz... (/ ile hazır yanıt)"}
              rows={2} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid " + (notModu ? "#fed7aa" : "#e5e7eb"), fontSize: 13, resize: "none", background: notModu ? "#fffbeb" : "#fff", outline: "none" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={() => setNotModu(!notModu)}
                style={{ padding: "8px 10px", borderRadius: 7, border: "1px solid " + (notModu ? "#fed7aa" : "#e5e7eb"), background: notModu ? "#fffbeb" : "#fff", cursor: "pointer", fontSize: 14 }}>🔒</button>
              <button onClick={gonder} disabled={!metin.trim() || gonderiyor}
                style={{ padding: "8px 14px", borderRadius: 7, border: "none", background: "#16a34a", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: (!metin.trim() || gonderiyor) ? 0.5 : 1 }}>↑</button>
            </div>
          </div>
        )}
      </div>

      {sonucModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            {!satisForm ? (
              <>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#111827", marginBottom: 4 }}>Konuşmayı Kapat</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Bir sonuç seçin</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SONUCLAR.map(s => (
                    <button key={s.key} onClick={() => kapat(s.key)}
                      style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#111827", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                      {s.label} <span style={{ float: "right", fontSize: 11, color: s.kapat ? "#16a34a" : "#f59e0b" }}>{s.kapat ? "Kapatır" : "Beklemede"}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setSonucModal(false)} style={{ marginTop: 12, width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>İptal</button>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#111827", marginBottom: 4 }}>🛒 Satışa Dönüştü</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Satış detaylarını girin</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Sipariş No</label>
                  <input value={siparisNo} onChange={e => setSiparisNo(e.target.value)} placeholder="ör. SP-2024-001"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Fatura No</label>
                  <input value={faturaNo} onChange={e => setFaturaNo(e.target.value)} placeholder="ör. FT-2024-001"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => kapat("satis")}
                    style={{ flex: 1, padding: 10, borderRadius: 8, background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
                    Kaydet ve Kapat
                  </button>
                  <button onClick={() => setSatisForm(false)}
                    style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>
                    Geri
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── INBOX ──────────────────────────────────────────────────────────────────
function Inbox({ profil, onSohbetAc }) {
  const [konusmalar, setKonusmalar] = useState([]);
  const [filtre, setFiltre]         = useState("active");
  const [arama, setArama]           = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    async function yukle() {
      const data = await getKonusmalar({ status: filtre === "all" || filtre === "active" ? undefined : filtre });
      if (filtre === "active") {
        setKonusmalar((data || []).filter(k => k.status === "open" || k.status === "beklemede"));
      } else {
        setKonusmalar(data || []);
      }
    }
    yukle();
    // Realtime yerine polling - 5 saniyede bir
    const interval = setInterval(() => {
      yukle();
    }, 5000);
    return () => clearInterval(interval);
  }, [filtre]);

  const liste = konusmalar.filter(k => {
    if (!arama) return true;
    const q = arama.toLowerCase();
    return k.contact_name?.toLowerCase().includes(q) || k.contact_phone?.includes(q);
  });

  function sure(tarih) {
    if (!tarih) return "";
    const fark = Date.now() - new Date(tarih).getTime();
    const dk = Math.floor(fark / 60000), s = Math.floor(dk / 60), g = Math.floor(s / 24);
    if (g > 0) return g + "g"; if (s > 0) return s + "s"; return Math.max(0, dk) + "dk";
  }

  const DURUM = { open: { label: "Açık", renk: "#16a34a" }, kapali: { label: "Kapalı", renk: "#6b7280" }, beklemede: { label: "Beklemede", renk: "#f59e0b" } };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Inbox</h1>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{liste.length} konuşma</div>
        </div>
        <input value={arama} onChange={e => setArama(e.target.value)} placeholder="İsim veya telefon ara..."
          style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, marginBottom: 10, outline: "none" }} />
        <div style={{ display: "flex", gap: 6 }}>
          {[["active","Aktif"],["open","Açık"],["beklemede","Beklemede"],["kapali","Kapalı"],["all","Tümü"]].map(([val, label]) => (
            <button key={val} onClick={() => setFiltre(val)}
              style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid", fontSize: 12, fontWeight: 500, cursor: "pointer",
                background: filtre === val ? "#dcfce7" : "#fff", borderColor: filtre === val ? "#16a34a" : "#e5e7eb", color: filtre === val ? "#16a34a" : "#6b7280" }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {yukleniyor
          ? <div style={{ textAlign: "center", padding: 40, color: "#e5e7eb", fontSize: 13 }}>―</div>
          : liste.length === 0
            ? <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Konuşma bulunamadı</div>
            : [...liste].sort((a, b) => {
                if (profil?.rol !== "temsilci") return 0;
                const aK = a.assigned_agent === profil?.id;
                const bK = b.assigned_agent === profil?.id;
                return aK === bK ? 0 : aK ? -1 : 1;
              }).map(k => {
                const isim = k.contact_name || k.contact_phone || "Bilinmiyor";
                const d = DURUM[k.status] || { label: k.status, renk: "#6b7280" };
                const benim = k.assigned_agent === profil?.id;
                return (
                  <div key={k.id} onClick={() => onSohbetAc(k.id)}
                    style={{ padding: "14px 20px", borderBottom: "1px solid #f9fafb", cursor: "pointer", borderLeft: benim ? "3px solid #16a34a" : "3px solid transparent", background: benim ? "#f0fdf4" : "#fff" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = benim ? "#f0fdf4" : "#fff"}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", fontWeight: 700, flexShrink: 0 }}>
                        {isim.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{isim}</span>
                          <span style={{ fontSize: 11, color: "#9ca3af" }} title={k.last_message_at ? new Date(k.last_message_at).toLocaleString("tr-TR") : ""}>
                            {sure(k.last_message_at)}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: "#9ca3af", flex: 1, minWidth: 60 }}>{k.category?.replace(/_/g, " ") || "—"}</span>
                          {k.assigned_profile ? (
                            <span style={{ fontSize: 10, color: "#16a34a", background: "#dcfce7", padding: "1px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>
                              👤 {k.assigned_profile.ad} {k.assigned_profile.soyad}
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, color: "#f59e0b", background: "#fffbeb", padding: "1px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>
                              ⏳ Atanmamış
                            </span>
                          )}
                          <span style={{ fontSize: 10, fontWeight: 600, color: d.renk, background: d.renk + "15", padding: "1px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>{d.label}</span>
                        </div>
                      </div>
                    </div>
                    {k.onceki_sonuc && (
                      <div style={{ marginTop: 6, marginLeft: 52, fontSize: 11, color: "#f59e0b", background: "#fffbeb", padding: "3px 8px", borderRadius: 4, border: "1px solid #fed7aa" }}>
                        ⚠️ Önceki: {k.onceki_sonuc}
                      </div>
                    )}
                  </div>
                );
              })
        }
      </div>
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
const KpiKart = ({ baslik, deger, alt, renk, icon }) => (
  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -15, right: -15, width: 70, height: 70, borderRadius: "50%", background: renk, opacity: 0.08 }} />
    <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
    <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{baslik}</div>
    <div style={{ color: "#111827", fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>{deger}</div>
    {alt && <div style={{ color: renk, fontSize: 12, marginTop: 4, fontWeight: 500 }}>{alt}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <p style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

function OzetBant({ profil }) {
  const [ozet, setOzet] = useState({ benim: 0, bekleyen: 0, bugun: 0 });

  useEffect(() => {
    async function yukle() {
      const bugun = new Date(); bugun.setHours(0,0,0,0);
      const [{ data: benim }, { data: bekleyen }, { data: bugunKonusmalar }] = await Promise.all([
        supabase.from("conversations").select("id", { count: "exact" }).eq("assigned_agent", profil?.id).eq("status", "open"),
        supabase.from("conversations").select("id", { count: "exact" }).is("assigned_agent", null).eq("status", "open"),
        supabase.from("conversations").select("id", { count: "exact" }).gte("created_at", bugun.toISOString())
      ]);
      setOzet({ benim: benim?.length || 0, bekleyen: bekleyen?.length || 0, bugun: bugunKonusmalar?.length || 0 });
    }
    if (profil?.id) yukle();
  }, [profil]);

  const ROL = { super_admin: "Süper Admin", admin: "Admin", temsilci: "Temsilci" };

  return (
    <div style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
          {profil?.ad?.charAt(0) || "?"}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{profil?.ad} {profil?.soyad}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{ROL[profil?.rol] || profil?.rol}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        {[
          { label: "Bende Açık", val: ozet.benim, icon: "💬" },
          { label: "Atanmamış", val: ozet.bekleyen, icon: "⏳" },
          { label: "Bugün Gelen", val: ozet.bugun, icon: "📅" },
        ].map((m, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>{m.icon} {m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{m.val}</div>
          </div>
        ))}
      </div>
      <div style={{ width: 120 }} />
    </div>
  );
}

function Dashboard({ profil }) {
  const [kpi, setKpi]               = useState({ bugunGelen: 0, haftaGelen: 0, bekleyen: 0, satis: 0, kapanmaOrani: 0 });
  const [gunluk, setGunluk]         = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    Promise.all([getKpiStats(), getDailyStats(15), getKategoriDagilim()])
      .then(([k, g, kat]) => { setKpi(k); setGunluk(g); setKategoriler(kat); setYukleniyor(false); })
      .catch(() => setYukleniyor(false));
  }, []);

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Genel Bakış</h1>
        <p style={{ fontSize: 13, color: "#6b7280" }}>Hoş geldin, {profil?.ad} · Son 15 gün</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        <KpiKart baslik="Bugün Gelen"    deger={kpi.bugunGelen}       alt="yeni konuşma"   renk="#16a34a" icon="💬" />
        <KpiKart baslik="Bu Hafta"       deger={kpi.haftaGelen}       alt="toplam konuşma" renk="#0891b2" icon="📅" />
        <KpiKart baslik="Bekleyen"       deger={kpi.bekleyen}         alt="yanıt bekliyor" renk="#ef4444" icon="⏳" />
        <KpiKart baslik="Kapanma Oranı"  deger={"%" + kpi.kapanmaOrani} alt={kpi.satis + " satış"} renk="#f59e0b" icon="✅" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 2 }}>Günlük Konuşma Trendi</div>
          <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 20 }}>Gelen · Kapanan · Satış</div>
          {(
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={gunluk}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="gun" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="gelen"   name="Gelen"   stroke="#16a34a" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="kapanan" name="Kapanan" stroke="#0891b2" strokeWidth={1.5} fill="none" />
                <Area type="monotone" dataKey="satis"   name="Satış"   stroke="#f59e0b" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 2 }}>Kategori Dağılımı</div>
          <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 16 }}>Konuşma türleri</div>
          {kategoriler.length === 0
            ? <div style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0", fontSize: 13 }}>Henüz veri yok</div>
            : <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={kategoriler} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {kategoriler.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={v => ["%" + v, ""]} contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {kategoriler.map((k, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: k.color }} />
                        <span style={{ fontSize: 11, color: "#6b7280" }}>{k.name}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: k.color }}>%{k.value}</span>
                    </div>
                  ))}
                </div>
              </>
          }
        </div>
      </div>
    </div>
  );
}

// ── PROFIL ──────────────────────────────────────────────────────────────────
function Profil({ profil }) {
  const [ad, setAd]         = useState(profil?.ad || "");
  const [soyad, setSoyad]   = useState(profil?.soyad || "");
  const [yeniSifre, setYeniSifre]   = useState("");
  const [yeniSifre2, setYeniSifre2] = useState("");
  const [sekme, setSekme]   = useState("profil");
  const [mesaj, setMesaj]   = useState(null);
  const [kaydediyor, setKaydediyor] = useState(false);

  function bildir(tip, msg) { setMesaj({ tip, msg }); setTimeout(() => setMesaj(null), 3000); }

  async function profilKaydet(e) {
    e.preventDefault(); setKaydediyor(true);
    try { await profilGuncelle(profil.id, { ad, soyad }); bildir("basari", "Profil güncellendi."); }
    catch { bildir("hata", "Güncelleme başarısız."); }
    finally { setKaydediyor(false); }
  }

  async function sifreDegistir(e) {
    e.preventDefault();
    if (yeniSifre !== yeniSifre2) { bildir("hata", "Şifreler eşleşmiyor."); return; }
    if (yeniSifre.length < 8) { bildir("hata", "En az 8 karakter olmalı."); return; }
    setKaydediyor(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: yeniSifre });
      if (error) throw error;
      bildir("basari", "Şifre güncellendi."); setYeniSifre(""); setYeniSifre2("");
    } catch (err) { bildir("hata", err.message); }
    finally { setKaydediyor(false); }
  }

  const ROL = { super_admin: "Süper Admin", admin: "Admin", temsilci: "Temsilci" };
  const DURUM_RENK = { aktif: "#16a34a", izinde: "#f59e0b", pasif: "#ef4444" };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 600 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 24 }}>Profil</h1>
      {mesaj && (
        <div style={{ padding: "10px 16px", borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 500,
          background: mesaj.tip === "basari" ? "#dcfce7" : "#fef2f2",
          border: "1px solid " + (mesaj.tip === "basari" ? "#bbf7d0" : "#fecaca"),
          color: mesaj.tip === "basari" ? "#15803d" : "#dc2626" }}>
          {mesaj.tip === "basari" ? "✅" : "❌"} {mesaj.msg}
        </div>
      )}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 20 }}>
            {(profil?.ad || "?").charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{profil?.ad} {profil?.soyad}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: "#6b7280", background: "#f3f4f6", padding: "2px 10px", borderRadius: 20 }}>{ROL[profil?.rol] || profil?.rol}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: DURUM_RENK[profil?.durum], background: DURUM_RENK[profil?.durum] + "15", padding: "2px 10px", borderRadius: 20 }}>
                {profil?.durum}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #f3f4f6", marginBottom: 20 }}>
          {[["profil","Profil Bilgileri"],["sifre","Şifre Değiştir"]].map(([k, l]) => (
            <button key={k} onClick={() => setSekme(k)}
              style={{ padding: "8px 16px", border: "none", background: "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer",
                color: sekme === k ? "#16a34a" : "#6b7280", borderBottom: "2px solid " + (sekme === k ? "#16a34a" : "transparent") }}>
              {l}
            </button>
          ))}
        </div>
        {sekme === "profil" ? (
          <form onSubmit={profilKaydet}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {[["Ad", ad, setAd], ["Soyad", soyad, setSoyad]].map(([label, val, setter]) => (
                <div key={label}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{label}</label>
                  <input value={val} onChange={e => setter(e.target.value)} required
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }} />
                </div>
              ))}
            </div>
            <button type="submit" disabled={kaydediyor}
              style={{ padding: "10px 24px", borderRadius: 8, background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", opacity: kaydediyor ? 0.7 : 1 }}>
              {kaydediyor ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </form>
        ) : (
          <form onSubmit={sifreDegistir}>
            {[["Yeni Şifre", yeniSifre, setYeniSifre, "En az 8 karakter"], ["Tekrar", yeniSifre2, setYeniSifre2, "Şifreyi tekrarla"]].map(([label, val, setter, ph]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{label}</label>
                <input type="password" value={val} onChange={e => setter(e.target.value)} required placeholder={ph}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }} />
              </div>
            ))}
            <button type="submit" disabled={kaydediyor}
              style={{ padding: "10px 24px", borderRadius: 8, background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", opacity: kaydediyor ? 0.7 : 1 }}>
              {kaydediyor ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── ATAMA KUYRUGU ───────────────────────────────────────────────────────────
function AtamaKuyrugu({ profil }) {
  const [konusmalar, setKonusmalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => { yukle(); }, []);

  async function yukle() {
    // veri yüklenirken spinner gösterme;
    const { data } = await supabase.from("conversations").select("*").eq("status", "open").is("assigned_agent", null).order("created_at", { ascending: true });
    setKonusmalar(data || []); setYukleniyor(false);
  }

  async function atamaYap(konusmaId) {
    try {
      const { error } = await supabase.from("conversations").update({ 
        assigned_agent: profil.id,
        status: "open"
      }).eq("id", konusmaId);
      if (error) { alert("Hata: " + error.message); return; }
      yukle();
    } catch(e) { alert("Hata: " + e.message); }
  }

  function sure(tarih) {
    if (!tarih) return "";
    const fark = Date.now() - new Date(tarih).getTime();
    const dk = Math.floor(fark / 60000), s = Math.floor(dk / 60), g = Math.floor(s / 24);
    if (g > 0) return g + " gün"; if (s > 0) return s + " saat"; return dk + " dk";
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Atama Kuyruğu</h1>
        <p style={{ fontSize: 13, color: "#6b7280" }}>Atanmamış {konusmalar.length} konuşma bekliyor</p>
      </div>
      {yukleniyor ? <div style={{ textAlign: "center", padding: 40, color: "#e5e7eb", fontSize: 13 }}>―</div>
        : konusmalar.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Kuyruk boş</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Tüm konuşmalar atandı</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {konusmalar.map(k => {
              const isim = k.contact_name || k.contact_phone || "Bilinmiyor";
              return (
                <div key={k.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", fontWeight: 700, fontSize: 16 }}>
                      {isim.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{isim}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                        {k.category?.replace(/_/g, " ") || "—"} · {sure(k.created_at)} önce geldi
                      </div>
                    </div>
                  </div>
                  <button onClick={() => atamaYap(k.id)}
                    style={{ padding: "8px 18px", borderRadius: 8, background: "#16a34a", color: "#fff", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
                    Üstlen
                  </button>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ── PERFORMANS RAPORU ───────────────────────────────────────────────────────
function PerformansRaporu({ profil }) {
  const [temsilciler, setTemsilciler] = useState([]);
  const [yukleniyor, setYukleniyor]   = useState(true);
  const [donem, setDonem]             = useState("hafta");

  useEffect(() => { yukle(); }, [donem]);

  async function yukle() {
    // veri yüklenirken spinner gösterme;
    const gun = donem === "bugun" ? 1 : donem === "hafta" ? 7 : 30;
    const since = new Date(); since.setDate(since.getDate() - gun);

    const [{ data: profiles }, { data: konusmalar }] = await Promise.all([
      supabase.from("profiles").select("*").eq("rol", "temsilci"),
      supabase.from("conversations").select("*").gte("created_at", since.toISOString())
    ]);

    const liste = (profiles || []).map(p => {
      const atanan   = konusmalar?.filter(k => k.assigned_agent === p.id) || [];
      const kapanan  = atanan.filter(k => k.status === "kapali" || k.status === "closed");
      const satis    = atanan.filter(k => k.sonuc === "satis");
      const oran     = atanan.length ? Math.round((kapanan.length / atanan.length) * 100) : 0;
      return { ...p, atanan: atanan.length, kapanan: kapanan.length, satis: satis.length, oran };
    }).sort((a, b) => b.oran - a.oran);

    setTemsilciler(liste); setYukleniyor(false);
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Performans Raporu</h1>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Temsilci bazlı istatistikler</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["bugun","Bugün"],["hafta","Bu Hafta"],["ay","Bu Ay"]].map(([val, label]) => (
            <button key={val} onClick={() => setDonem(val)}
              style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid", fontSize: 12, fontWeight: 500, cursor: "pointer",
                background: donem === val ? "#dcfce7" : "#fff", borderColor: donem === val ? "#16a34a" : "#e5e7eb", color: donem === val ? "#16a34a" : "#6b7280" }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {yukleniyor ? <div style={{ textAlign: "center", padding: 40, color: "#e5e7eb", fontSize: 13 }}>―</div>
        : temsilciler.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 13 }}>Temsilci bulunamadı</div>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {temsilciler.map((t, i) => (
              <div key={t.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: i === 0 ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#16a34a,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
                      {i === 0 ? "🥇" : t.ad?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{t.ad} {t.soyad}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{t.atanan} konuşma</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 24 }}>
                    {[
                      { label: "Kapanan", val: t.kapanan, renk: "#16a34a" },
                      { label: "Satış",   val: t.satis,   renk: "#f59e0b" },
                      { label: "Oran",    val: "%" + t.oran, renk: t.oran > 80 ? "#16a34a" : t.oran > 60 ? "#f59e0b" : "#ef4444" },
                    ].map((m, j) => (
                      <div key={j} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>{m.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: m.renk }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ height: 6, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: t.oran + "%", background: t.oran > 80 ? "#16a34a" : t.oran > 60 ? "#f59e0b" : "#ef4444", borderRadius: 4, transition: "width 0.5s" }} />
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── KATEGORİ YÖNETİMİ ──────────────────────────────────────────────────────
function KategoriYonetimi({ profil }) {
  const [kategoriler, setKategoriler] = useState([]);
  const [yukleniyor, setYukleniyor]   = useState(true);
  const [yeniIsim, setYeniIsim]       = useState("");
  const [yeniAnahtar, setYeniAnahtar] = useState("");
  const [mesaj, setMesaj]             = useState(null);

  useEffect(() => { yukle(); }, []);

  async function yukle() {
    // veri yüklenirken spinner gösterme;
    const { data } = await supabase.from("kategoriler").select("*").order("isim");
    setKategoriler(data || []); setYukleniyor(false);
  }

  function bildir(tip, msg) { setMesaj({ tip, msg }); setTimeout(() => setMesaj(null), 3000); }

  async function ekle(e) {
    e.preventDefault();
    const { error } = await supabase.from("kategoriler").insert({ isim: yeniIsim, anahtar_kelimeler: yeniAnahtar.split(",").map(s => s.trim()).filter(Boolean), aktif: true });
    if (error) { bildir("hata", "Eklenemedi: " + error.message); return; }
    bildir("basari", "Kategori eklendi."); setYeniIsim(""); setYeniAnahtar(""); yukle();
  }

  async function durumToggle(id, aktif) {
    await supabase.from("kategoriler").update({ aktif: !aktif }).eq("id", id);
    yukle();
  }

  async function sil(id) {
    if (!window.confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) return;
    await supabase.from("kategoriler").delete().eq("id", id);
    yukle();
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Kategori Yönetimi</h1>
        <p style={{ fontSize: 13, color: "#6b7280" }}>Konuşma kategorilerini yönetin</p>
      </div>
      {mesaj && (
        <div style={{ padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500,
          background: mesaj.tip === "basari" ? "#dcfce7" : "#fef2f2",
          border: "1px solid " + (mesaj.tip === "basari" ? "#bbf7d0" : "#fecaca"),
          color: mesaj.tip === "basari" ? "#15803d" : "#dc2626" }}>
          {mesaj.tip === "basari" ? "✅" : "❌"} {mesaj.msg}
        </div>
      )}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 16 }}>Yeni Kategori Ekle</div>
        <form onSubmit={ekle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Kategori Adı</label>
              <input value={yeniIsim} onChange={e => setYeniIsim(e.target.value)} required placeholder="ör. Fiyat Sorgusu"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Anahtar Kelimeler (virgülle ayır)</label>
              <input value={yeniAnahtar} onChange={e => setYeniAnahtar(e.target.value)} placeholder="fiyat, ücret, kaç para"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }} />
            </div>
          </div>
          <button type="submit"
            style={{ padding: "9px 20px", borderRadius: 8, background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
            + Ekle
          </button>
        </form>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {yukleniyor ? <div style={{ textAlign: "center", padding: 30, color: "#e5e7eb", fontSize: 13 }}>―</div>
          : kategoriler.map(k => (
            <div key={k.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                  {k.isim}
                  <span style={{ fontSize: 11, fontWeight: 500, color: k.aktif ? "#16a34a" : "#9ca3af", background: k.aktif ? "#dcfce7" : "#f3f4f6", padding: "2px 8px", borderRadius: 4 }}>
                    {k.aktif ? "Aktif" : "Pasif"}
                  </span>
                </div>
                {k.anahtar_kelimeler?.length > 0 && (
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                    🔑 {k.anahtar_kelimeler.join(", ")}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => durumToggle(k.id, k.aktif)}
                  style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 11, cursor: "pointer" }}>
                  {k.aktif ? "Pasif Yap" : "Aktif Yap"}
                </button>
                <button onClick={() => sil(k.id)}
                  style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #fecaca", background: "#fff", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>
                  Sil
                </button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── HAZIR YANITLAR ──────────────────────────────────────────────────────────
function HazirYanitlar({ profil }) {
  const [yanitlar, setYanitlar]     = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yeniBaslik, setYeniBaslik] = useState("");
  const [yeniKisayol, setYeniKisayol] = useState("");
  const [yeniIcerik, setYeniIcerik] = useState("");
  const [mesaj, setMesaj]           = useState(null);

  useEffect(() => { yukle(); }, []);

  async function yukle() {
    // veri yüklenirken spinner gösterme;
    const { data } = await supabase.from("hazir_yanitlar").select("*").order("kisayol");
    setYanitlar(data || []); setYukleniyor(false);
  }

  function bildir(tip, msg) { setMesaj({ tip, msg }); setTimeout(() => setMesaj(null), 3000); }

  async function ekle(e) {
    e.preventDefault();
    const kisayol = yeniKisayol.replace(/^\//, "").toLowerCase().replace(/\s+/g, "_");
    const { error } = await supabase.from("hazir_yanitlar").insert({ baslik: yeniBaslik, kisayol, icerik: yeniIcerik, aktif: true, olusturan: profil?.id });
    if (error) { bildir("hata", "Eklenemedi: " + error.message); return; }
    bildir("basari", "Hazır yanıt eklendi."); setYeniBaslik(""); setYeniKisayol(""); setYeniIcerik(""); yukle();
  }

  async function sil(id) {
    if (!window.confirm("Bu hazır yanıtı silmek istediğinizden emin misiniz?")) return;
    await supabase.from("hazir_yanitlar").delete().eq("id", id);
    yukle();
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Hazır Yanıtlar</h1>
        <p style={{ fontSize: 13, color: "#6b7280" }}>/ kısayoluyla sohbette kullanın</p>
      </div>
      {mesaj && (
        <div style={{ padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500,
          background: mesaj.tip === "basari" ? "#dcfce7" : "#fef2f2",
          border: "1px solid " + (mesaj.tip === "basari" ? "#bbf7d0" : "#fecaca"),
          color: mesaj.tip === "basari" ? "#15803d" : "#dc2626" }}>
          {mesaj.tip === "basari" ? "✅" : "❌"} {mesaj.msg}
        </div>
      )}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 16 }}>Yeni Hazır Yanıt</div>
        <form onSubmit={ekle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Başlık</label>
              <input value={yeniBaslik} onChange={e => setYeniBaslik(e.target.value)} required placeholder="ör. Fiyat Bilgisi"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Kısayol</label>
              <input value={yeniKisayol} onChange={e => setYeniKisayol(e.target.value)} required placeholder="ör. fiyat"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Yanıt İçeriği</label>
            <textarea value={yeniIcerik} onChange={e => setYeniIcerik(e.target.value)} required rows={3}
              placeholder="Müşteriye gönderilecek mesaj..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, resize: "vertical", outline: "none" }} />
          </div>
          <button type="submit"
            style={{ padding: "9px 20px", borderRadius: 8, background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
            + Ekle
          </button>
        </form>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {yukleniyor ? <div style={{ textAlign: "center", padding: 30, color: "#e5e7eb", fontSize: 13 }}>―</div>
          : yanitlar.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: "#9ca3af", fontSize: 13 }}>Henüz hazır yanıt yok</div>
          : yanitlar.map(y => (
            <div key={y.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                    {y.baslik}
                    <span style={{ fontSize: 11, color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: 4, fontFamily: "monospace" }}>/{y.kisayol}</span>
                  </div>
                </div>
                <button onClick={() => sil(y.id)}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #fecaca", background: "#fff", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>
                  Sil
                </button>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", background: "#f9fafb", padding: "8px 12px", borderRadius: 6, lineHeight: 1.6 }}>
                {y.icerik}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}


// ── TEMSİLCİ YÖNETİMİ ──────────────────────────────────────────────────────
function TemsilciYonetimi({ profil }) {
  const [temsilciler, setTemsilciler] = useState([]);
  const [yukleniyor, setYukleniyor]   = useState(true);
  const [modal, setModal]             = useState(null);
  const [mesaj, setMesaj]             = useState(null);

  useEffect(() => { yukle(); }, []);

  async function yukle() {
    // veri yüklenirken spinner gösterme;
    const data = await getTemsilciler();
    setTemsilciler(data); setYukleniyor(false);
  }

  function bildir(tip, msg) { setMesaj({ tip, msg }); setTimeout(() => setMesaj(null), 3000); }

  async function durumDegistir(id, yeniDurum) {
    try { await profilGuncelle(id, { durum: yeniDurum }); bildir("basari", "Durum güncellendi."); setModal(null); yukle(); }
    catch { bildir("hata", "Güncelleme başarısız."); }
  }

  async function rolDegistir(id, yeniRol) {
    try { await profilGuncelle(id, { rol: yeniRol }); bildir("basari", "Rol güncellendi."); setModal(null); yukle(); }
    catch { bildir("hata", "Güncelleme başarısız."); }
  }

  const ROL_ETIKET  = { super_admin: "Süper Admin", admin: "Admin", temsilci: "Temsilci" };
  const DURUM_RENK  = { aktif: "#16a34a", izinde: "#f59e0b", pasif: "#ef4444" };
  const DURUM_ETIKET = { aktif: "🟢 Aktif", izinde: "🏖️ İzinde", pasif: "⛔ Pasif" };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Temsilci Yönetimi</h1>
          <p style={{ fontSize: 13, color: "#6b7280" }}>{temsilciler.length} kullanıcı</p>
        </div>
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 16px", fontSize: 12, color: "#6b7280" }}>
          💡 Yeni kullanıcı eklemek için Supabase → Authentication → Users
        </div>
      </div>

      {mesaj && (
        <div style={{ padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500,
          background: mesaj.tip === "basari" ? "#dcfce7" : "#fef2f2",
          border: "1px solid " + (mesaj.tip === "basari" ? "#bbf7d0" : "#fecaca"),
          color: mesaj.tip === "basari" ? "#15803d" : "#dc2626" }}>
          {mesaj.tip === "basari" ? "✅" : "❌"} {mesaj.msg}
        </div>
      )}

      {yukleniyor ? <div style={{ textAlign: "center", padding: 40, color: "#e5e7eb", fontSize: 13 }}>―</div>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {temsilciler.map(t => (
              <div key={t.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>
                    {t.ad?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{t.ad} {t.soyad}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{ROL_ETIKET[t.rol] || t.rol}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: DURUM_RENK[t.durum] || "#6b7280", background: (DURUM_RENK[t.durum] || "#6b7280") + "15", padding: "4px 12px", borderRadius: 20 }}>
                    {DURUM_ETIKET[t.durum] || t.durum}
                  </span>
                  {t.id !== profil?.id && (
                    <>
                      <button onClick={() => setModal({ tip: "durum", veri: t })}
                        style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>
                        Durum
                      </button>
                      <button onClick={() => setModal({ tip: "rol", veri: t })}
                        style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>
                        Rol
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#111827", marginBottom: 4 }}>
              {modal.tip === "durum" ? "Durum Değiştir" : "Rol Değiştir"}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>{modal.veri.ad} {modal.veri.soyad}</div>

            {modal.tip === "durum" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {Object.entries(DURUM_ETIKET).map(([key, label]) => (
                  <button key={key} onClick={() => durumDegistir(modal.veri.id, key)}
                    style={{ padding: "12px 16px", borderRadius: 8, border: "2px solid " + (modal.veri.durum === key ? DURUM_RENK[key] : "#e5e7eb"),
                      background: modal.veri.durum === key ? DURUM_RENK[key] + "10" : "#fff",
                      color: "#111827", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {modal.tip === "rol" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {Object.entries(ROL_ETIKET).map(([key, label]) => (
                  <button key={key} onClick={() => rolDegistir(modal.veri.id, key)}
                    style={{ padding: "12px 16px", borderRadius: 8, border: "2px solid " + (modal.veri.rol === key ? "#16a34a" : "#e5e7eb"),
                      background: modal.veri.rol === key ? "#dcfce7" : "#fff",
                      color: "#111827", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => setModal(null)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// ── RAPORLAMA ──────────────────────────────────────────────────────────────
function Raporlama({ profil }) {
  const bugun = new Date().toISOString().split("T")[0];
  const ayBaslangic = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [baslangic, setBaslangic]   = useState(ayBaslangic);
  const [bitis, setBitis]           = useState(bugun);
  const [statü, setStatü]           = useState("all");
  const [temsilci, setTemsilci]     = useState("all");
  const [temsilciler, setTemsilciler] = useState([]);
  const [konusmalar, setKonusmalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    getTemsilciler().then(setTemsilciler);
    ara();
  }, []);

  async function ara() {
    // veri yüklenirken spinner gösterme;
    let query = supabase.from("conversations").select("*, assigned_profile:profiles!conversations_assigned_agent_fkey(ad, soyad)")
      .gte("created_at", baslangic + "T00:00:00")
      .lte("created_at", bitis + "T23:59:59")
      .order("created_at", { ascending: false });

    if (statü !== "all") query = query.eq("status", statü);
    // Temsilci rolü sadece kendi verilerini görebilir
    if (profil?.rol === "temsilci") {
      query = query.eq("assigned_agent", profil.id);
    } else if (temsilci === "unassigned") {
      query = query.is("assigned_agent", null);
    } else if (temsilci !== "all") {
      query = query.eq("assigned_agent", temsilci);
    }

    const { data } = await query;
    setKonusmalar(data || []);
    setYukleniyor(false);
  }

  function csvIndir() {
    const basliklar = ["Müşteri", "Telefon", "Kategori", "Statü", "Sonuç", "Sipariş No", "Fatura No", "Temsilci", "Oluşturulma", "Son Güncelleme"];
    const satirlar = konusmalar.map(k => [
      k.contact_name || "",
      k.contact_phone || "",
      k.category || "",
      k.status || "",
      k.sonuc || "",
      k.siparis_no || "",
      k.fatura_no || "",
      k.assigned_profile ? k.assigned_profile.ad + " " + k.assigned_profile.soyad : "",
      k.created_at ? new Date(k.created_at).toLocaleString("tr-TR") : "",
      k.last_message_at ? new Date(k.last_message_at).toLocaleString("tr-TR") : ""
    ]);
    const csv = [basliklar, ...satirlar].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `metalreyonu-rapor-${baslangic}-${bitis}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const DURUM = { open: { label: "Açık", renk: "#16a34a" }, kapali: { label: "Kapalı", renk: "#6b7280" }, beklemede: { label: "Beklemede", renk: "#f59e0b" } };
  const SONUC_ETIKET = { satis: "🛒 Satış", soru_cevaplandi: "💬 Cevaplandı", takip: "🔄 Takipte", siparis_cozuldu: "📦 Sipariş", kayip: "❌ Kayıp", degisim_tamam: "🔄 Değişim", sikayet_islemde: "⚠️ Şikayet", kargo_cozuldu: "🚚 Kargo", iade_cozuldu: "✅ İade", spam: "🚫 Spam" };

  // Özet istatistikler
  const toplam = konusmalar.length;
  const satislar = konusmalar.filter(k => k.sonuc === "satis").length;
  const kapalanlar = konusmalar.filter(k => k.status === "kapali").length;
  const bekleyenler = konusmalar.filter(k => k.status === "open").length;

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Raporlama</h1>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Konuşma geçmişi ve analiz</p>
        </div>
        <button onClick={csvIndir} disabled={konusmalar.length === 0}
          style={{ padding: "9px 20px", borderRadius: 8, background: konusmalar.length === 0 ? "#e5e7eb" : "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
          ⬇️ CSV İndir ({konusmalar.length})
        </button>
      </div>

      {/* Filtreler */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Başlangıç</label>
            <input type="date" value={baslangic} onChange={e => setBaslangic(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Bitiş</label>
            <input type="date" value={bitis} onChange={e => setBitis(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Statü</label>
            <select value={statü} onChange={e => setStatü(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none", background: "#fff" }}>
              <option value="all">Tümü</option>
              <option value="open">Açık</option>
              <option value="beklemede">Beklemede</option>
              <option value="kapali">Kapalı</option>
            </select>
          </div>
          {profil?.rol !== "temsilci" && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Temsilci</label>
              <select value={temsilci} onChange={e => setTemsilci(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none", background: "#fff" }}>
                <option value="all">Tümü</option>
                <option value="unassigned">Atanmamış</option>
                {temsilciler.map(t => <option key={t.id} value={t.id}>{t.ad} {t.soyad}</option>)}
              </select>
            </div>
          )}
          <button onClick={ara}
            style={{ padding: "9px 20px", borderRadius: 8, background: "#111827", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
            Ara
          </button>
        </div>
      </div>

      {/* Özet kartlar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Toplam", val: toplam, renk: "#6b7280", icon: "📊" },
          { label: "Açık", val: bekleyenler, renk: "#16a34a", icon: "💬" },
          { label: "Kapanan", val: kapalanlar, renk: "#0891b2", icon: "✅" },
          { label: "Satış", val: satislar, renk: "#f59e0b", icon: "🛒" },
        ].map((m, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 24 }}>{m.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>{m.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: m.renk }}>{m.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tablo */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Müşteri", "Telefon", "Kategori", "Statü", "Sonuç", "Sipariş No", "Fatura No", "Temsilci", "Tarih"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yukleniyor ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Yükleniyor...</td></tr>
              ) : konusmalar.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Sonuç bulunamadı</td></tr>
              ) : konusmalar.map(k => {
                const d = DURUM[k.status] || { label: k.status, renk: "#6b7280" };
                return (
                  <tr key={k.id} style={{ borderBottom: "1px solid #f3f4f6" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{k.contact_name || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#6b7280" }}>{k.contact_phone || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#6b7280" }}>{k.category?.replace(/_/g, " ") || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: d.renk, background: d.renk + "15", padding: "2px 8px", borderRadius: 4 }}>{d.label}</span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#6b7280" }}>{SONUC_ETIKET[k.sonuc] || k.sonuc || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>{k.siparis_no || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>{k.fatura_no || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#6b7280" }}>{k.assigned_profile ? k.assigned_profile.ad + " " + k.assigned_profile.soyad : "Atanmamış"}</td>
                    <td style={{ padding: "10px 14px", color: "#9ca3af", fontSize: 12, whiteSpace: "nowrap" }}>{k.created_at ? new Date(k.created_at).toLocaleDateString("tr-TR") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── ANA APP ────────────────────────────────────────────────────────────────
const MENU = [
  { key: "dashboard",        label: "📊 Dashboard",        roller: ["super_admin","admin","temsilci"] },
  { key: "inbox",            label: "💬 Inbox",             roller: ["super_admin","admin","temsilci"] },
  { key: "atama_kuyrugu",    label: "📋 Atama Kuyruğu",    roller: ["super_admin","admin","temsilci"] },
  { key: "performans",       label: "📈 Performans",        roller: ["super_admin","admin"] },
  { key: "kategori",         label: "🏷️ Kategoriler",       roller: ["super_admin","admin"] },
  { key: "hazir_yanitlar",   label: "⚡ Hazır Yanıtlar",    roller: ["super_admin","admin","temsilci"] },
  { key: "temsilci_yonetimi", label: "👥 Temsilciler",      roller: ["super_admin","admin"] },
  { key: "raporlama",         label: "📋 Raporlama",         roller: ["super_admin","admin","temsilci"] },
  { key: "profil",           label: "👤 Profil",            roller: ["super_admin","admin","temsilci"] },
];

export default function App() {
  const [kullanici, setKullanici]   = useState(null);
  const [profil, setProfil]         = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aktifSayfa, setAktifSayfa] = useState("dashboard");
  const [aktifKonusma, setAktifKonusma] = useState(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setKullanici(session.user);
        await profilYukle(session.user.id);
      }
      setYukleniyor(false);
    }).catch(() => {
      if (mounted) setYukleniyor(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" && session?.user) {
        setKullanici(session.user);
        await profilYukle(session.user.id);
        setYukleniyor(false);
      } else if (event === "SIGNED_OUT") {
        setKullanici(null);
        setProfil(null);
        setYukleniyor(false);
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function profilYukle(userId) {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      setProfil(data);
    } catch {}
  }

  if (yukleniyor) return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTop: "3px solid #16a34a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Yükleniyor...</p>
        </div>
      </div>
    </>
  );

  if (!kullanici) return <><style>{GLOBAL_STYLE}</style><Login /></>;

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <div style={{ display: "flex", height: "100vh" }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#16a34a,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💬</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#111827" }}>Metal Reyonu</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>WhatsApp Yönetim</div>
              </div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {MENU.filter(m => m.roller.includes(profil?.rol || "temsilci")).map(item => (
              <button key={item.key} onClick={() => { setAktifSayfa(item.key); setAktifKonusma(null); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: aktifSayfa === item.key ? 600 : 500, textAlign: "left", width: "100%",
                  background: aktifSayfa === item.key ? "#dcfce7" : "transparent",
                  color: aktifSayfa === item.key ? "#16a34a" : "#6b7280" }}>
                {item.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: "12px 16px", borderTop: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>
                {profil?.ad?.charAt(0) || "?"}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{profil?.ad} {profil?.soyad}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{{ super_admin: "Süper Admin", admin: "Admin", temsilci: "Temsilci" }[profil?.rol]}</div>
              </div>
            </div>
            <button onClick={() => cikisYap()}
              style={{ width: "100%", padding: 7, borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* İçerik */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
          <OzetBant profil={profil} />
          <div style={{ flex: 1, overflow: "auto" }}>
          {aktifKonusma
            ? <Sohbet konusmaId={aktifKonusma} profil={profil} onGeri={() => { setAktifKonusma(null); setAktifSayfa("inbox"); }} />
            : aktifSayfa === "dashboard"      ? <Dashboard profil={profil} />
            : aktifSayfa === "inbox"          ? <Inbox profil={profil} onSohbetAc={id => setAktifKonusma(id)} />
            : aktifSayfa === "atama_kuyrugu"  ? <AtamaKuyrugu profil={profil} />
            : aktifSayfa === "performans"     ? <PerformansRaporu profil={profil} />
            : aktifSayfa === "kategori"       ? <KategoriYonetimi profil={profil} />
            : aktifSayfa === "hazir_yanitlar" ? <HazirYanitlar profil={profil} />
            : aktifSayfa === "temsilci_yonetimi" ? <TemsilciYonetimi profil={profil} />
            : aktifSayfa === "raporlama"         ? <Raporlama profil={profil} />
            : aktifSayfa === "profil"         ? <Profil profil={profil} />
            : null}
          </div>
        </div>
      </div>
    </>
  );
}

