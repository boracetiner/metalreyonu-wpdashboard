import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { getDailyStats, getKpiStats, getKategoriler, getBekleyenler, getTemsilciler } from "./supabaseClient";

const SAATLIK = [
  { saat: "08", mesaj: 4 }, { saat: "09", mesaj: 12 }, { saat: "10", mesaj: 19 },
  { saat: "11", mesaj: 22 }, { saat: "12", mesaj: 17 }, { saat: "13", mesaj: 8 },
  { saat: "14", mesaj: 21 }, { saat: "15", mesaj: 28 }, { saat: "16", mesaj: 24 },
  { saat: "17", mesaj: 18 }, { saat: "18", mesaj: 11 }, { saat: "19", mesaj: 6 },
];

const OncelikBadge = ({ oncelik }) => {
  const styles = {
    kritik: { background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" },
    yuksek: { background: "rgba(249,115,22,0.2)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.3)" },
    orta:   { background: "rgba(245,158,11,0.2)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" },
  };
  const labels = { kritik: "Kritik", yuksek: "Yüksek", orta: "Orta" };
  return <span style={{ ...styles[oncelik], padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{labels[oncelik]}</span>;
};

const KpiKart = ({ baslik, deger, alt, renk, icon }) => (
  <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: renk, opacity: 0.12, filter: "blur(20px)" }} />
    <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
    <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, fontFamily: "monospace" }}>{baslik}</div>
    <div style={{ color: "#f1f5f9", fontSize: 32, fontWeight: 800, lineHeight: 1.1 }}>{deger}</div>
    <div style={{ color: renk, fontSize: 12, marginTop: 6, fontFamily: "monospace" }}>{alt}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function App() {
  const [sekme, setSekme] = useState("dashboard");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gunluk, setGunluk] = useState([]);
  const [kpi, setKpi] = useState({ bugunGelen: 0, yanıtOrani: 0, ortSure: 0, bekleyen: 0 });
  const [kategoriler, setKategoriler] = useState([]);
  const [bekleyenler, setBekleyenler] = useState([]);
  const [temsilciler, setTemsilciler] = useState([]);

  useEffect(() => {
    async function yukle() {
      setYukleniyor(true);
      const [g, k, kat, b, t] = await Promise.all([
        getDailyStats(), getKpiStats(), getKategoriler(), getBekleyenler(), getTemsilciler()
      ]);
      setGunluk(g); setKpi(k); setKategoriler(kat); setBekleyenler(b); setTemsilciler(t);
      setYukleniyor(false);
    }
    yukle();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060d1a; font-family: 'Syne', sans-serif; color: #f1f5f9; }
        .blink { animation: blink 1.4s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "rgba(15,23,42,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #25D366, #128C7E)", display: "flex", alignItems: "center", justifyContent: "center" }}>💬</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Metal Reyon</div>
            <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>WA DASHBOARD MVP</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["dashboard","📊 Dashboard"],["bekleyenler","⏳ Bekleyenler"],["temsilciler","👥 Temsilciler"]].map(([key, label]) => (
            <button key={key} onClick={() => setSekme(key)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: sekme === key ? "#f1f5f9" : "#64748b", background: sekme === key ? "rgba(59,130,246,0.2)" : "transparent", border: sekme === key ? "1px solid rgba(59,130,246,0.4)" : "1px solid transparent" }}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="blink" style={{ width: 7, height: 7, borderRadius: "50%", background: "#25D366" }} />
          <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{yukleniyor ? "YÜKLENİYOR..." : "CANLI"}</span>
        </div>
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1280, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {sekme === "dashboard" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Genel Bakış</h1>
            <p style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace", marginBottom: 24 }}>Son 15 gün · Supabase canlı veri</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
              <KpiKart baslik="Bugün Gelen" deger={kpi.bugunGelen} alt="bugün toplam konuşma" renk="#3b82f6" icon="💬" />
              <KpiKart baslik="Yanıt Oranı" deger={`%${kpi.yanıtOrani}`} alt="hedef: %90" renk="#25D366" icon="✅" />
              <KpiKart baslik="Ort. Yanıt" deger={kpi.ortSure ? `${kpi.ortSure} dk` : "—"} alt="ilk yanıt süresi" renk="#f59e0b" icon="⏱️" />
              <KpiKart baslik="Bekleyen" deger={kpi.bekleyen} alt="yanıt bekliyor" renk="#ef4444" icon="🚨" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 20 }}>
              <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Günlük Mesaj Trendi</div>
                <div style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace", marginBottom: 20 }}>Gelen · Cevaplanan · Cevapsız</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={gunluk}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#25D366" stopOpacity={0.3}/><stop offset="95%" stopColor="#25D366" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="gun" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="gelen" name="Gelen" stroke="#3b82f6" strokeWidth={2} fill="url(#g1)" />
                    <Area type="monotone" dataKey="cevaplanan" name="Cevaplanan" stroke="#25D366" strokeWidth={2} fill="url(#g2)" />
                    <Area type="monotone" dataKey="cevapsiz" name="Cevapsız" stroke="#ef4444" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Kategori Dağılımı</div>
                <div style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace", marginBottom: 16 }}>Konuşma türlerine göre</div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={kategoriler} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                      {kategoriler.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`%${v}`,""]} contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {kategoriler.map((k, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: k.color }} />
                        <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{k.name}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: k.color, fontFamily: "monospace" }}>%{k.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Saatlik Yoğunluk</div>
              <div style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace", marginBottom: 20 }}>Hangi saatlerde en çok mesaj geliyor?</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={SAATLIK} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="saat" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}:00`} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="mesaj" name="Mesaj" radius={[4,4,0,0]}>
                    {SAATLIK.map((e, i) => <Cell key={i} fill={e.mesaj >= 20 ? "#3b82f6" : e.mesaj >= 12 ? "#0891b2" : "#1e3a5f"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* BEKLEYENlER */}
        {sekme === "bekleyenler" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Bekleyen Konuşmalar</h1>
            <p style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace", marginBottom: 24 }}>En uzun bekleyenden sıralı · {bekleyenler.length} bekleyen</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bekleyenler.length === 0 && <div style={{ color: "#64748b", textAlign: "center", padding: 40 }}>🎉 Bekleyen konuşma yok</div>}
              {bekleyenler.map((b) => (
                <div key={b.id} style={{ background: b.oncelik === "kritik" ? "linear-gradient(135deg,#1a0a0a,#1e1010)" : "linear-gradient(135deg,#0f172a,#1e293b)", border: `1px solid ${b.oncelik === "kritik" ? "rgba(239,68,68,0.25)" : b.oncelik === "yuksek" ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ fontSize: 22 }}>{b.oncelik === "kritik" ? "🔴" : b.oncelik === "yuksek" ? "🟠" : "🟡"}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{b.musteri}</div>
                      <div style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace", marginTop: 2 }}>{b.telefon}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", marginBottom: 2 }}>KATEGORİ</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{b.kategori}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", marginBottom: 2 }}>BEKLİYOR</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: b.oncelik === "kritik" ? "#ef4444" : b.oncelik === "yuksek" ? "#f97316" : "#f59e0b", fontFamily: "monospace" }}>{b.sure}</div>
                    </div>
                    <OncelikBadge oncelik={b.oncelik} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEMSİLCİLER */}
        {sekme === "temsilciler" && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Temsilci Performansı</h1>
            <p style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace", marginBottom: 24 }}>Tag eşlemesine göre</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {temsilciler.length === 0 && <div style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Henüz veri yok</div>}
              {temsilciler.map((t, i) => (
                <div key={i} style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: t.oran > 0 ? 16 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a5f,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#93c5fd" }}>{t.ad.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{t.ad}</div>
                        <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", marginTop: 1 }}>{t.atanan} konuşma atandı</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 24 }}>
                      {[
                        { label: "Cevaplayan", val: t.cevaplayan, color: "#25D366" },
                        { label: "Ort. Süre", val: t.ort_sure ? `${t.ort_sure} dk` : "—", color: t.ort_sure > 30 ? "#ef4444" : "#f59e0b" },
                        { label: "Yanıt Oranı", val: `%${t.oran}`, color: t.oran > 90 ? "#25D366" : t.oran > 80 ? "#f59e0b" : "#ef4444" },
                      ].map((m, j) => (
                        <div key={j} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", marginBottom: 3 }}>{m.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: m.color, fontFamily: "monospace" }}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {t.oran > 0 && (
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                      <div st
