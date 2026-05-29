import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Navigation, Scissors } from "lucide-react";
import { useGetJobTracking, getGetJobTrackingQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";

// ─── City grid + animated barber trip ─────────────────────────────────────────
// All coordinates are in viewBox units (0–100 × 0–100)

const CLIENT_POS  = { x: 54, y: 60 };   // static — client location
const BARBER_PATH = [                    // barber route waypoints
  { x: 14, y: 16 },
  { x: 14, y: 44 },
  { x: 36, y: 44 },
  { x: 36, y: 60 },
  { x: 54, y: 60 },
];

const TRIP_DURATION_S = 90; // seconds for full simulated trip

// Casablanca-flavoured street names at certain grid lines
const STREET_LABELS = [
  { x: 14, y: 8,  label: "Bd Anfa",         horizontal: false },
  { x: 36, y: 8,  label: "Rue Pdt Kennedy", horizontal: false },
  { x: 54, y: 8,  label: "Av Hassan II",    horizontal: false },
  { x: 5,  y: 28, label: "Bd Zerktouni",    horizontal: true  },
  { x: 5,  y: 44, label: "Rue Ibn Battouta", horizontal: true  },
  { x: 5,  y: 60, label: "Av Mers Sultan",  horizontal: true  },
  { x: 5,  y: 76, label: "Bd Bir Anzarane", horizontal: true  },
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function posAlongPath(t: number) {
  const segs = BARBER_PATH.length - 1;
  const raw  = t * segs;
  const idx  = Math.min(Math.floor(raw), segs - 1);
  const frac = raw - idx;
  const from = BARBER_PATH[idx];
  const to   = BARBER_PATH[idx + 1];
  return { x: lerp(from.x, to.x, frac), y: lerp(from.y, to.y, frac) };
}

function totalPathLength() {
  let d = 0;
  for (let i = 0; i < BARBER_PATH.length - 1; i++) {
    const dx = BARBER_PATH[i + 1].x - BARBER_PATH[i].x;
    const dy = BARBER_PATH[i + 1].y - BARBER_PATH[i].y;
    d += Math.sqrt(dx * dx + dy * dy);
  }
  return d;
}
const FULL_LEN = totalPathLength();

// Remaining distance in km (fake — full trip ≈ 1.4 km)
function remainingKm(t: number) {
  return ((1 - t) * 1.4).toFixed(2);
}

// ─── Animated map component ───────────────────────────────────────────────────
function FakeMap({
  proName, clientName, isClient,
}: {
  proName: string; clientName: string; isClient: boolean;
}) {
  const [progress, setProgress] = useState(0);   // 0..1
  const [pulse, setPulse]       = useState(false);
  const startRef = useRef<number | null>(null);
  const rafRef   = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = performance.now();

    function tick(now: number) {
      const elapsed = (now - (startRef.current ?? now)) / 1000;
      const t = Math.min(elapsed / TRIP_DURATION_S, 1);
      setProgress(t);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // Pulse glow rings every second
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 800);
    return () => clearInterval(id);
  }, []);

  const barber  = posAlongPath(progress);
  const arrived = progress >= 0.99;
  const etaMin  = Math.max(0, Math.round((1 - progress) * TRIP_DURATION_S / 60));
  const etaSec  = Math.round((1 - progress) * TRIP_DURATION_S % 60);
  const etaStr  = arrived ? "Arrived!" : etaMin > 0 ? `${etaMin} min` : `${etaSec} sec`;
  const distStr = arrived ? "0 m" : `${remainingKm(progress)} km`;

  // Build dashed route from barber current pos to client
  const routePts = [barber, ...BARBER_PATH.slice(
    BARBER_PATH.findIndex((_, i) => {
      const t0 = i / (BARBER_PATH.length - 1);
      return t0 >= progress;
    })
  ), CLIENT_POS].filter(Boolean);

  const polyline = routePts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  // Grid lines (horizontal + vertical streets)
  const hLines = [16, 28, 44, 60, 76, 88];
  const vLines = [14, 28, 36, 54, 68, 82];

  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full"
      style={{ background: "radial-gradient(ellipse 120% 100% at 50% 40%, #2d1260 0%, #1a0030 70%)" }}
    >
      <defs>
        <filter id="glow-cyan">
          <feGaussianBlur stdDeviation="1.2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-pink">
          <feGaussianBlur stdDeviation="1.2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-soft">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Building blocks (between grid cells) ── */}
      {hLines.slice(0, -1).flatMap((y1, hi) =>
        vLines.slice(0, -1).map((x1, vi) => {
          const x2 = vLines[vi + 1];
          const y2 = hLines[hi + 1];
          const skip = (hi + vi) % 3 === 1; // occasional open lots
          return skip ? null : (
            <rect
              key={`b${hi}-${vi}`}
              x={x1 + 1.2} y={y1 + 1.2}
              width={x2 - x1 - 2.4} height={y2 - y1 - 2.4}
              fill="#2a0845" opacity={0.55} rx={0.5}
            />
          );
        })
      )}

      {/* ── Roads (horizontal) ── */}
      {hLines.map(y => (
        <line key={`h${y}`} x1={0} y1={y} x2={100} y2={y}
          stroke="#4a2870" strokeWidth={1.4} />
      ))}

      {/* ── Roads (vertical) ── */}
      {vLines.map(x => (
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={100}
          stroke="#4a2870" strokeWidth={1.4} />
      ))}

      {/* ── Street labels ── */}
      {STREET_LABELS.map((s, i) => (
        <text
          key={i}
          x={s.horizontal ? s.x : s.x + 0.5}
          y={s.horizontal ? s.y - 1.2 : s.y}
          fontSize={2.1}
          fill="#7a5aaa"
          fontFamily="monospace"
          transform={s.horizontal ? undefined : `rotate(-90, ${s.x + 0.5}, ${s.y})`}
        >
          {s.label}
        </text>
      ))}

      {/* ── Route dashed line ── */}
      {!arrived && (
        <path
          d={polyline}
          fill="none"
          stroke="#00f2ff"
          strokeWidth={0.8}
          strokeDasharray="2 1.5"
          opacity={0.65}
        />
      )}

      {/* ── Client marker ── */}
      {/* Outer pulse ring */}
      <circle
        cx={CLIENT_POS.x} cy={CLIENT_POS.y}
        r={pulse ? 5 : 3.5}
        fill="none" stroke="#00f2ff"
        strokeWidth={0.5}
        opacity={pulse ? 0.25 : 0.5}
        style={{ transition: "r 0.8s ease-out, opacity 0.8s ease-out" }}
      />
      {/* Inner dot */}
      <circle
        cx={CLIENT_POS.x} cy={CLIENT_POS.y}
        r={2.4}
        fill="#00f2ff"
        filter="url(#glow-cyan)"
      />
      {/* Label */}
      <text
        x={CLIENT_POS.x} y={CLIENT_POS.y - 3.8}
        textAnchor="middle" fontSize={2.4}
        fill="#00f2ff" fontWeight="bold" fontFamily="sans-serif"
      >
        {isClient ? "You" : clientName}
      </text>

      {/* ── Barber marker ── */}
      {/* Outer pulse ring */}
      <circle
        cx={barber.x} cy={barber.y}
        r={pulse ? 4.5 : 3}
        fill="none" stroke="#ff007f"
        strokeWidth={0.5}
        opacity={pulse ? 0.3 : 0.55}
        style={{ transition: "r 0.8s ease-out, opacity 0.8s ease-out" }}
      />
      {/* Inner dot */}
      <circle
        cx={barber.x} cy={barber.y}
        r={2.4}
        fill={arrived ? "#00f2ff" : "#ff007f"}
        filter="url(#glow-pink)"
        style={{ transition: "fill 0.5s" }}
      />
      {/* Scissors icon (text) */}
      <text
        x={barber.x} y={barber.y + 0.9}
        textAnchor="middle" fontSize={2.2}
        fill="white" fontFamily="sans-serif"
      >
        ✂
      </text>
      {/* Label */}
      <text
        x={barber.x} y={barber.y - 3.8}
        textAnchor="middle" fontSize={2.4}
        fill="#ff007f" fontWeight="bold" fontFamily="sans-serif"
      >
        {isClient ? proName : "You"}
      </text>

      {/* ── ETA badge ── */}
      <rect x={2} y={2} width={24} height={10} rx={2}
        fill="rgba(26,0,48,0.85)"
        stroke={arrived ? "#00f2ff" : "#ff007f"}
        strokeWidth={0.5}
      />
      <text x={5} y={7.5} fontSize={2.6} fill={arrived ? "#00f2ff" : "#ff007f"} fontWeight="bold" fontFamily="sans-serif">
        {arrived ? "✓ Arrived!" : `ETA: ${etaStr}`}
      </text>
      <text x={5} y={10.2} fontSize={2} fill="#9a7acc" fontFamily="sans-serif">
        {arrived ? "Barber is at your door" : `${distStr} away`}
      </text>

      {/* ── Route direction arrows along path ── */}
      {!arrived && BARBER_PATH.slice(0, -1).map((from, i) => {
        const segProgress = i / (BARBER_PATH.length - 1);
        if (progress > segProgress + 0.25) return null; // already passed
        const to  = BARBER_PATH[i + 1];
        const mx  = (from.x + to.x) / 2;
        const my  = (from.y + to.y) / 2;
        const ang = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
        return (
          <text
            key={i}
            x={mx} y={my + 0.8}
            textAnchor="middle" fontSize={2.2}
            fill="#00f2ff" opacity={0.5} fontFamily="sans-serif"
            transform={`rotate(${ang}, ${mx}, ${my})`}
          >
            ›
          </text>
        );
      })}

      {/* ── Distance badge at client ── */}
      {!arrived && (
        <>
          <rect
            x={CLIENT_POS.x - 10} y={CLIENT_POS.y + 4}
            width={20} height={6} rx={1.5}
            fill="rgba(26,0,48,0.80)" stroke="#00f2ff22" strokeWidth={0.4}
          />
          <text
            x={CLIENT_POS.x} y={CLIENT_POS.y + 8.4}
            textAnchor="middle" fontSize={2.3} fill="#a0c4ff" fontFamily="sans-serif"
          >
            📍 Client location
          </text>
        </>
      )}
    </svg>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const { jobId }  = useParams<{ jobId: string }>();
  const id         = parseInt(jobId, 10);
  const [, setLocation] = useLocation();
  const { user }   = useAuth();

  const { data: tracking } = useGetJobTracking(id, {
    query: {
      enabled: !!id && !isNaN(id),
      refetchInterval: 3000,
      queryKey: getGetJobTrackingQueryKey(id),
    },
  });

  const isClient  = user?.role === "client";
  const proName   = tracking?.professionalName ?? "Barber";
  const clientName = tracking?.clientName ?? "Client";
  const otherName = isClient ? proName : clientName;

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "#1a0030" }}>
      {/* ── Header ── */}
      <div
        className="flex items-center gap-4 px-5 pt-5 pb-4 border-b z-10 relative flex-shrink-0"
        style={{ background: "rgba(26,0,48,0.95)", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <button
          onClick={() => setLocation("/")}
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-black text-xl">Live Tracking</h1>
          <p className="text-sm truncate" style={{ color: "#9a7acc" }}>
            {isClient ? `${proName} is on the way` : `Navigate to ${clientName}`}
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 flex-shrink-0"
          style={{ background: "rgba(0,242,255,0.08)", border: "1px solid rgba(0,242,255,0.25)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse" />
          <span className="text-xs font-bold" style={{ color: "#00f2ff" }}>LIVE</span>
        </div>
      </div>

      {/* ── Animated map ── */}
      <div className="flex-1 relative min-h-0" style={{ minHeight: 320 }}>
        <FakeMap proName={proName} clientName={clientName} isClient={isClient} />

        {/* Legend */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div
            className="flex items-center gap-4 px-5 py-2.5 rounded-2xl text-sm font-bold backdrop-blur-sm"
            style={{ background: "rgba(26,0,48,0.80)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <span className="flex items-center gap-1.5" style={{ color: "#00f2ff" }}>
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#00f2ff", boxShadow: "0 0 6px #00f2ff" }} />
              {isClient ? "You" : clientName}
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
            <span className="flex items-center gap-1.5" style={{ color: "#ff007f" }}>
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#ff007f", boxShadow: "0 0 6px #ff007f" }} />
              {isClient ? proName : "You"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom status panel ── */}
      <div
        className="px-5 pt-4 pb-8 space-y-3 flex-shrink-0 border-t"
        style={{ background: "rgba(26,0,48,0.95)", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="grid grid-cols-2 gap-3">
          {/* You */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  background: isClient ? "#00f2ff" : "#ff007f",
                  boxShadow: isClient ? "0 0 6px #00f2ff" : "0 0 6px #ff007f",
                }}
              />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(243,241,246,0.45)" }}>You</span>
            </div>
            <p className="font-bold text-sm text-white truncate">{user?.name ?? "You"}</p>
            <p className="text-xs mt-1 font-semibold text-green-400">📍 Sharing location</p>
          </div>

          {/* Other party */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
                style={{
                  background: isClient ? "#ff007f" : "#00f2ff",
                  boxShadow: isClient ? "0 0 6px #ff007f" : "0 0 6px #00f2ff",
                }}
              />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(243,241,246,0.45)" }}>
                {isClient ? "Barber" : "Client"}
              </span>
            </div>
            <p className="font-bold text-sm text-white truncate">{otherName}</p>
            <p className="text-xs mt-1 font-semibold text-green-400">📍 Live location</p>
          </div>
        </div>

        {/* Tip */}
        <p className="text-center text-xs" style={{ color: "rgba(154,122,204,0.7)" }}>
          <Navigation size={10} className="inline mr-1 opacity-60" />
          Simulated route — live GPS tracking available with location permissions
        </p>
      </div>
    </div>
  );
}
