import { useState } from "react";
import { useLocation } from "wouter";
import { X, Scissors, ChevronRight, Sparkles } from "lucide-react";

type Section = "mens" | "womens";

const UNS = "https://images.unsplash.com";

type Style = {
  id: string;
  name: string;
  nameAr: string;
  photo: string;
  duration: string;
  price: string;
  tags: string[];
};

const MENS_STYLES: Style[] = [
  {
    id: "fade",
    name: "Fade Cut",
    nameAr: "دغراد",
    photo: `${UNS}/photo-1503951914875-452162b0f3f1`,
    duration: "30 min",
    price: "50–80 MAD",
    tags: ["Modern", "Clean", "Popular"],
  },
  {
    id: "barbershop",
    name: "Classic Barbershop",
    nameAr: "كلاسيك",
    photo: `${UNS}/photo-1585747860715-2ba37e788b70`,
    duration: "45 min",
    price: "60–90 MAD",
    tags: ["Vintage", "Sharp", "Traditional"],
  },
  {
    id: "pompadour",
    name: "Pompadour",
    nameAr: "بومبادور",
    photo: `${UNS}/photo-1506794778202-cad84cf45f1d`,
    duration: "40 min",
    price: "70–100 MAD",
    tags: ["Styled", "Elegant", "Volume"],
  },
  {
    id: "shave",
    name: "Traditional Shave",
    nameAr: "حلاقة تقليدية",
    photo: `${UNS}/photo-1599351431202-1e0f0137899a`,
    duration: "25 min",
    price: "35–50 MAD",
    tags: ["Relax", "Ritual", "Smooth"],
  },
  {
    id: "textured",
    name: "Textured Crop",
    nameAr: "كروب تيكستشرد",
    photo: `${UNS}/photo-1605497788044-5a32c7078486`,
    duration: "35 min",
    price: "55–75 MAD",
    tags: ["Trendy", "Casual", "Low-maintenance"],
  },
  {
    id: "beard",
    name: "Beard Design",
    nameAr: "تصميم لحية",
    photo: `${UNS}/photo-1621905251189-08b45d6a269e`,
    duration: "20 min",
    price: "40–60 MAD",
    tags: ["Sharp", "Masculine", "Define"],
  },
];

const WOMENS_STYLES: Style[] = [
  {
    id: "balayage",
    name: "Balayage",
    nameAr: "بالاياج",
    photo: `${UNS}/photo-1522337360788-8b13dee7a37e`,
    duration: "2–3h",
    price: "200–400 MAD",
    tags: ["Color", "Natural", "Sun-kissed"],
  },
  {
    id: "keratin",
    name: "Keratin Lissage",
    nameAr: "كيراتين",
    photo: `${UNS}/photo-1570172619644-dfd03ed5d881`,
    duration: "2–4h",
    price: "300–600 MAD",
    tags: ["Smooth", "Frizz-free", "Lasting"],
  },
  {
    id: "blowout",
    name: "Blow-out & Style",
    nameAr: "بلاو أوت",
    photo: `${UNS}/photo-1621905251189-08b45d6a269e`,
    duration: "45 min",
    price: "80–130 MAD",
    tags: ["Volume", "Glossy", "Event-ready"],
  },
  {
    id: "nails",
    name: "Nails Art",
    nameAr: "فن الأظافر",
    photo: `${UNS}/photo-1516975080664-ed2fc6a32937`,
    duration: "60 min",
    price: "80–200 MAD",
    tags: ["Gel", "Acrylic", "Design"],
  },
  {
    id: "coloring",
    name: "Full Coloring",
    nameAr: "صبغة كاملة",
    photo: `${UNS}/photo-1527799820374-87036dcd41a4`,
    duration: "90 min",
    price: "150–300 MAD",
    tags: ["Vibrant", "Coverage", "Transform"],
  },
  {
    id: "cut_style",
    name: "Coupe & Brushing",
    nameAr: "قص وتمشيط",
    photo: `${UNS}/photo-1519699047748-de8e457a634e`,
    duration: "60 min",
    price: "80–150 MAD",
    tags: ["Fresh", "Shaped", "Polished"],
  },
];

const SECTION_CONFIG = {
  mens: {
    label: "Men's",
    emoji: "👨",
    accent: "#00B4FF",
    accentBg: "rgba(0,180,255,0.12)",
    accentBorder: "rgba(0,180,255,0.35)",
    styles: MENS_STYLES,
    mapFilter: "barber",
    headline: "Find your next cut",
    sub: "Browse popular men's styles · show it to your barber",
  },
  womens: {
    label: "Women's",
    emoji: "👩",
    accent: "#FF1F8E",
    accentBg: "rgba(255,31,142,0.12)",
    accentBorder: "rgba(255,31,142,0.35)",
    styles: WOMENS_STYLES,
    mapFilter: "nails",
    headline: "Discover your look",
    sub: "Browse women's styles · show it to your salon",
  },
};

function ShowModal({
  style,
  section,
  onClose,
  onBook,
}: {
  style: Style;
  section: Section;
  onClose: () => void;
  onBook: () => void;
}) {
  const cfg = SECTION_CONFIG[section];
  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-black" onClick={onClose}>
      {/* Full photo */}
      <div className="relative flex-1 overflow-hidden">
        <img
          src={`${style.photo}?w=800&h=1200&fit=crop&q=85`}
          alt={style.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.9) 100%)" }} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-12 right-4 z-10 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center"
        >
          <X size={20} className="text-white" />
        </button>

        {/* "Show to barber" badge */}
        <div
          className="absolute top-12 left-4 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: cfg.accentBg, border: `1px solid ${cfg.accentBorder}` }}
        >
          <Sparkles size={11} style={{ color: cfg.accent }} />
          <span className="text-[11px] font-black" style={{ color: cfg.accent }}>Show to my barber</span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-6" onClick={e => e.stopPropagation()}>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {style.tags.map(t => (
              <span key={t} className="text-[10px] font-bold rounded-full px-2 py-0.5"
                style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
                {t}
              </span>
            ))}
          </div>

          <h2 className="text-white font-black text-3xl leading-tight mb-0.5">{style.name}</h2>
          <p className="text-gray-400 text-sm mb-1">{style.nameAr}</p>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-gray-300 text-sm">⏱ {style.duration}</span>
            <span className="text-gray-300 text-sm">💰 {style.price}</span>
          </div>

          <button
            onClick={onBook}
            className="w-full py-4 rounded-2xl font-black text-black text-base flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(90deg, ${cfg.accent}, ${section === "mens" ? "#9B30FF" : "#FF8E1F"})` }}
          >
            <Scissors size={18} />
            Book this style near me
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StylesPage() {
  const [, setLocation] = useLocation();
  const [section, setSection] = useState<Section>("mens");
  const [showStyle, setShowStyle] = useState<Style | null>(null);

  const cfg = SECTION_CONFIG[section];

  const handleBook = () => {
    setShowStyle(null);
    setLocation(`/?cat=${cfg.mapFilter}`);
  };

  return (
    <div className="min-h-[100dvh] bg-[#090013] pb-28">
      {showStyle && (
        <ShowModal
          style={showStyle}
          section={section}
          onClose={() => setShowStyle(null)}
          onBook={handleBook}
        />
      )}

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-[#090013]/95 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={20} style={{ color: cfg.accent }} />
          <div>
            <h1 className="text-white font-black text-xl leading-tight">Style Showcase</h1>
            <p className="text-gray-500 text-[10px]">{cfg.sub}</p>
          </div>
        </div>

        {/* Men / Women toggle */}
        <div className="flex gap-2">
          {(["mens", "womens"] as Section[]).map(s => {
            const c = SECTION_CONFIG[s];
            const active = section === s;
            return (
              <button
                key={s}
                onClick={() => setSection(s)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all"
                style={{
                  background: active ? c.accentBg : "rgba(255,255,255,0.04)",
                  border: `2px solid ${active ? c.accent : "rgba(255,255,255,0.06)"}`,
                  color: active ? c.accent : "#4b5563",
                  boxShadow: active ? `0 0 16px ${c.accentBg}` : "none",
                }}
              >
                <span className="text-lg">{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Headline banner ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ background: cfg.accentBg, border: `1px solid ${cfg.accentBorder}` }}>
          <div>
            <p className="font-black text-white text-base">{cfg.headline}</p>
            <p className="text-xs mt-0.5" style={{ color: cfg.accent }}>
              Tap a style · show it to your barber · book nearby
            </p>
          </div>
          <button
            onClick={() => setLocation(`/?cat=${cfg.mapFilter}`)}
            className="flex items-center gap-1 rounded-xl px-3 py-2 font-black text-xs shrink-0 ml-3"
            style={{ background: cfg.accent, color: "#000" }}
          >
            Map <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* ── Styles grid ── */}
      <div className="px-4 pt-3 grid grid-cols-2 gap-3">
        {cfg.styles.map(style => (
          <button
            key={style.id}
            onClick={() => setShowStyle(style)}
            className="rounded-2xl overflow-hidden text-left transition-all active:scale-[0.96] border"
            style={{ background: "#130028", borderColor: "rgba(255,255,255,0.07)" }}
          >
            {/* Photo */}
            <div className="relative h-40 overflow-hidden">
              <img
                src={`${style.photo}?w=400&h=320&fit=crop&q=75`}
                alt={style.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(19,0,40,0.9) 100%)" }} />
              {/* Show badge */}
              <div className="absolute bottom-2 right-2 rounded-full px-2 py-0.5"
                style={{ background: cfg.accentBg, border: `1px solid ${cfg.accentBorder}` }}>
                <span className="text-[8px] font-black" style={{ color: cfg.accent }}>Show →</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-2.5">
              <p className="text-white font-black text-[13px] leading-tight">{style.name}</p>
              <p className="text-gray-600 text-[10px] mt-0.5 mb-1.5">{style.nameAr}</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-[9px]">{style.duration}</span>
                <span className="text-[9px] font-bold" style={{ color: cfg.accent }}>{style.price}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Bottom CTA ── */}
      <div className="px-4 mt-6">
        <button
          onClick={() => setLocation(`/?cat=${cfg.mapFilter}`)}
          className="w-full py-4 rounded-2xl font-black text-base text-black flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(90deg, ${cfg.accent}, ${section === "mens" ? "#9B30FF" : "#FF8E1F"})` }}
        >
          <Scissors size={18} />
          Find {cfg.label} Salons Near Me
        </button>
      </div>
    </div>
  );
}
