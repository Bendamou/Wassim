import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────

export type MascotState = "idle" | "encouraging" | "happy" | "thinking" | "celebrating";

interface MascotContextValue {
  state: MascotState;
  setState: (s: MascotState) => void;
  message: string | null;
  showMessage: (msg: string, duration?: number) => void;
  dismissMessage: () => void;
}

const MascotContext = createContext<MascotContextValue>({
  state: "idle",
  setState: () => {},
  message: null,
  showMessage: () => {},
  dismissMessage: () => {},
});

export function useMascot() {
  return useContext(MascotContext);
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function MascotProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MascotState>("encouraging");
  const [message, setMessage] = useState<string | null>(
    "Bienvenue sur Tawoss! 🌟"
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = useCallback((msg: string, duration = 5000) => {
    setMessage(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (duration > 0) {
      timerRef.current = setTimeout(() => setMessage(null), duration);
    }
  }, []);

  const dismissMessage = useCallback(() => {
    setMessage(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Auto-dismiss welcome message after 5s
  useEffect(() => {
    timerRef.current = setTimeout(() => setMessage(null), 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <MascotContext.Provider value={{ state, setState, message, showMessage, dismissMessage }}>
      {children}
      <TawossMascot />
    </MascotContext.Provider>
  );
}

// ── Animation Variants ────────────────────────────────────────────────────────

const BODY_VARIANTS: Record<MascotState, object> = {
  idle: {
    scale: [1, 1.025, 1],
    y: [0, -3, 0],
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
  },
  encouraging: {
    scale: [1, 1.04, 1],
    y: [0, -6, 0],
    rotate: [0, 2, -2, 0],
    transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
  },
  happy: {
    scale: [1, 1.12, 0.95, 1.08, 1],
    y: [0, -18, 0, -10, 0],
    transition: { duration: 0.8, repeat: Infinity, ease: "easeOut" },
  },
  thinking: {
    rotate: [-4, 4, -4],
    y: [0, -2, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  celebrating: {
    scale: [1, 1.15, 0.9, 1.1, 1],
    rotate: [0, 12, -12, 8, 0],
    y: [0, -20, 0],
    transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
  },
};

// ── Bubble messages per state ─────────────────────────────────────────────────

const IDLE_MESSAGES = [
  "Trouvez le meilleur coiffeur 💈",
  "Réservez en quelques secondes ⚡",
  "Tawoss – votre beauté, notre passion 🦚",
  "Découvrez les salons près de vous 📍",
];

// ── The Mascot Component ───────────────────────────────────────────────────────

function TawossMascot() {
  const { state, message, showMessage, dismissMessage } = useMascot();
  const [visible, setVisible] = useState(true);
  const [msgIdx, setMsgIdx] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  // Periodic blink
  useEffect(() => {
    const blinkLoop = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(blinkLoop);
  }, []);

  // Cycle idle messages every 8s
  useEffect(() => {
    if (state !== "idle") return;
    const id = setInterval(() => {
      setMsgIdx(i => (i + 1) % IDLE_MESSAGES.length);
    }, 8000);
    return () => clearInterval(id);
  }, [state]);

  const handleTap = () => {
    if (message) {
      dismissMessage();
    } else {
      showMessage(IDLE_MESSAGES[msgIdx], 4000);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        bottom: "80px",
        right: "12px",
      }}
    >
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {/* Speech Bubble */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 10, originX: 1, originY: 1 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 6 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="relative max-w-[180px] rounded-2xl rounded-br-sm px-3.5 py-2.5 shadow-xl cursor-pointer"
              style={{
                background: "linear-gradient(135deg,#0d1b2a,#1a2a3a)",
                border: "1.5px solid rgba(0,180,255,0.35)",
                boxShadow: "0 4px 20px rgba(0,180,255,0.2)",
              }}
              onClick={dismissMessage}
            >
              <p className="text-[12px] font-bold leading-snug text-white">{message}</p>
              {/* Tail */}
              <div className="absolute bottom-[-7px] right-3 w-3 h-3 rotate-45 rounded-sm"
                style={{ background: "#1a2a3a", borderRight: "1.5px solid rgba(0,180,255,0.35)", borderBottom: "1.5px solid rgba(0,180,255,0.35)" }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascot body */}
        <motion.div
          key={state}
          animate={BODY_VARIANTS[state]}
          className="relative cursor-pointer select-none"
          style={{ width: 72, height: 72 }}
          onClick={handleTap}
          whileTap={{ scale: 0.88 }}
        >
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: state === "happy" || state === "celebrating"
                ? ["0 0 0px 0px rgba(255,31,142,0)", "0 0 18px 8px rgba(255,31,142,0.5)", "0 0 0px 0px rgba(255,31,142,0)"]
                : ["0 0 0px 0px rgba(0,180,255,0)", "0 0 14px 5px rgba(0,180,255,0.4)", "0 0 0px 0px rgba(0,180,255,0)"],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Tawoss logo */}
          <img
            src="/tawoss-logo.png"
            alt="Tawoss mascot"
            className="w-full h-full object-contain drop-shadow-lg"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,180,255,0.4))" }}
            draggable={false}
          />

          {/* Blink overlay — positioned over eyes area */}
          <AnimatePresence>
            {isBlinking && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                exit={{ scaleY: 0 }}
                transition={{ duration: 0.07 }}
                className="absolute pointer-events-none"
                style={{
                  top: "36%",
                  left: "34%",
                  width: "32%",
                  height: "9%",
                  background: "rgba(26,11,46,0.6)",
                  borderRadius: "40%",
                  transformOrigin: "center",
                }}
              />
            )}
          </AnimatePresence>

          {/* Thinking bubble dots */}
          <AnimatePresence>
            {state === "thinking" && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute -top-3 -right-1 flex gap-0.5 items-end"
              >
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="rounded-full shadow"
                    style={{ width: 4 + i * 2, height: 4 + i * 2, background: "#00B4FF" }}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Happy stars */}
          <AnimatePresence>
            {(state === "happy" || state === "celebrating") && (
              <>
                {["-top-2 -left-1", "-top-3 right-0", "top-0 -right-3"].map((pos, i) => (
                  <motion.div
                    key={i}
                    className={`absolute ${pos} text-xs`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], rotate: [0, 20, 0] }}
                    transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                  >
                    ✨
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Dismiss / hide button */}
        <motion.button
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          onClick={() => setVisible(false)}
          whileTap={{ scale: 0.9 }}
        >
          hide
        </motion.button>
      </div>
    </div>
  );
}
