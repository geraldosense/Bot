import { useMemo } from 'react';
import { motion } from 'framer-motion';

const BILL_COUNT = 28;
const COIN_COUNT = 14;

/** Nota estilo dólar — proporção e detalhes realistas */
function DollarBill({ width, variant, uid }) {
  const height = width * 0.42;
  const face = variant === 100 ? '#3A6B47' : variant === 50 ? '#4A7A55' : '#5C8F62';
  const accent = variant === 100 ? '#1E4530' : '#2D5A3D';

  return (
    <div
      className="relative select-none"
      style={{
        width,
        height,
        transformStyle: 'preserve-3d',
        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
      }}
    >
      <svg width={width} height={height} viewBox="0 0 120 50" fill="none" aria-hidden>
        <rect width="120" height="50" rx="2.5" fill={face} />
        <rect x="1" y="1" width="118" height="48" rx="2" stroke={accent} strokeWidth="0.6" fill="none" opacity="0.7" />
        {/* Orla decorativa */}
        <rect x="4" y="4" width="112" height="42" rx="1.5" stroke="#C5E1A5" strokeOpacity="0.25" strokeWidth="0.5" fill="none" />
        {/* Cantos — valor */}
        <text x="8" y="12" fill="#E8F5E9" fontSize="6" fontWeight="700" opacity="0.9">
          {variant}
        </text>
        <text x="112" y="12" textAnchor="end" fill="#E8F5E9" fontSize="6" fontWeight="700" opacity="0.9">
          {variant}
        </text>
        <text x="8" y="44" fill="#E8F5E9" fontSize="6" fontWeight="700" opacity="0.9">
          {variant}
        </text>
        <text x="112" y="44" textAnchor="end" fill="#E8F5E9" fontSize="6" fontWeight="700" opacity="0.9">
          {variant}
        </text>
        {/* Retrato central (silhueta) */}
        <ellipse cx="60" cy="25" rx="14" ry="17" fill={accent} opacity="0.55" />
        <ellipse cx="60" cy="22" rx="10" ry="12" fill="#2A5038" opacity="0.4" />
        {/* Selo */}
        <circle cx="92" cy="25" r="7" stroke="#C5E1A5" strokeOpacity="0.35" strokeWidth="0.6" fill={accent} fillOpacity="0.3" />
        {/* Linhas finas (texto decorativo) */}
        <line x1="22" y1="25" x2="42" y2="25" stroke="#A5D6A7" strokeOpacity="0.2" strokeWidth="0.5" />
        <line x1="78" y1="25" x2="82" y2="25" stroke="#A5D6A7" strokeOpacity="0.2" strokeWidth="0.5" />
        <text x="60" y="48" textAnchor="middle" fill="#C8E6C9" fontSize="3.5" letterSpacing="1.2" opacity="0.45">
          FEDERAL RESERVE
        </text>
        {/* Brilho de papel */}
        <rect
          x="0"
          y="0"
          width="120"
          height="50"
          rx="2.5"
          fill={`url(#shine-${uid})`}
          opacity="0.35"
        />
        <defs>
          <linearGradient id={`shine-${uid}`} x1="0" y1="0" x2="120" y2="50">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/** Moeda com rebordo */
function GoldCoin({ size, uid }) {
  return (
    <div
      className="relative select-none rounded-full"
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
        filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="16" cy="16" r="15" fill={`url(#coinFace-${uid})`} />
        <circle cx="16" cy="16" r="15" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
        {/* Rebordo */}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const x1 = 16 + Math.cos(a) * 13.2;
          const y1 = 16 + Math.sin(a) * 13.2;
          const x2 = 16 + Math.cos(a) * 14.8;
          const y2 = 16 + Math.sin(a) * 14.8;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#78350F"
              strokeWidth="0.35"
              opacity="0.5"
            />
          );
        })}
        <circle cx="16" cy="16" r="10" stroke="#FDE68A" strokeOpacity="0.4" strokeWidth="0.5" fill="none" />
        <text x="16" y="20" textAnchor="middle" fill="#451A03" fontSize="10" fontWeight="900">
          $
        </text>
        <defs>
          <radialGradient id={`coinFace-${uid}`} cx="35%" cy="30%" r="70%">
            <stop stopColor="#FEF3C7" />
            <stop offset="0.4" stopColor="#FBBF24" />
            <stop offset="0.85" stopColor="#D97706" />
            <stop offset="1" stopColor="#92400E" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function createBills(count) {
  const rnd = seeded(42);
  return Array.from({ length: count }, (_, i) => {
    rnd();
    return {
      id: `bill-${i}`,
      kind: 'bill',
      left: `${3 + rnd() * 94}%`,
      width: 52 + Math.floor(rnd() * 28),
      variant: [20, 50, 100][i % 3],
      delay: rnd() * 5,
      duration: 9 + rnd() * 5,
      drift: (rnd() - 0.5) * 80,
      windAmp: 12 + rnd() * 22,
      baseTilt: (rnd() - 0.5) * 40,
      flutterSpeed: 1.8 + rnd() * 1.4,
      depth: rnd(),
    };
  });
}

function createCoins(count) {
  const rnd = seeded(99);
  return Array.from({ length: count }, (_, i) => {
    rnd();
    return {
      id: `coin-${i}`,
      kind: 'coin',
      left: `${5 + rnd() * 90}%`,
      size: 20 + Math.floor(rnd() * 14),
      delay: rnd() * 4,
      duration: 6 + rnd() * 4,
      drift: (rnd() - 0.5) * 50,
      spinDir: rnd() > 0.5 ? 1 : -1,
      depth: rnd(),
    };
  });
}

/** Nota — queda com gravidade + flutter 3D (papel ao vento) */
function FallingBill({ item }) {
  const depthScale = 0.65 + item.depth * 0.45;
  const opacity = 0.55 + item.depth * 0.45;
  const windSteps = 8;
  const windPath = Array.from({ length: windSteps }, (_, i) => {
    const t = i / (windSteps - 1);
    const gust = Math.sin(t * Math.PI * 3 + item.baseTilt) * item.windAmp;
    return item.drift * t + gust;
  });

  return (
    <motion.div
      className="absolute will-change-transform"
      style={{
        left: item.left,
        top: 0,
        zIndex: Math.floor(item.depth * 10),
        scale: depthScale,
      }}
      initial={{ y: '-20vh', x: 0, opacity: 0 }}
      animate={{
        y: ['-20vh', '115vh'],
        x: windPath,
        opacity: [0, opacity, opacity, opacity * 0.9, 0],
      }}
      transition={{
        y: {
          duration: item.duration,
          delay: item.delay,
          repeat: Infinity,
          ease: [0.32, 0.02, 0.68, 0.98],
        },
        x: {
          duration: item.duration,
          delay: item.delay,
          repeat: Infinity,
          ease: 'easeInOut',
          times: windPath.map((_, i) => i / (windSteps - 1)),
        },
        opacity: {
          duration: item.duration,
          delay: item.delay,
          repeat: Infinity,
          times: [0, 0.05, 0.85, 0.96, 1],
        },
      }}
    >
      <motion.div
        style={{ transformStyle: 'preserve-3d', perspective: 600 }}
        animate={{
          rotateX: [0, 52, -38, 45, -42, 30, -25, 0],
          rotateY: [-18, 28, -32, 22, -26, 18, -12, 0],
          rotateZ: [
            item.baseTilt,
            item.baseTilt + 14,
            item.baseTilt - 18,
            item.baseTilt + 10,
            item.baseTilt - 12,
            item.baseTilt + 8,
            item.baseTilt - 6,
            item.baseTilt,
          ],
        }}
        transition={{
          duration: item.flutterSpeed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <DollarBill width={item.width} variant={item.variant} uid={item.id} />
      </motion.div>
    </motion.div>
  );
}

/** Moeda — queda com rotação (tumbling) */
function FallingCoin({ item }) {
  const depthScale = 0.6 + item.depth * 0.5;
  const opacity = 0.6 + item.depth * 0.4;
  const spins = 3 + Math.floor(item.depth * 4);

  return (
    <motion.div
      className="absolute will-change-transform"
      style={{
        left: item.left,
        top: 0,
        zIndex: Math.floor(item.depth * 10),
        scale: depthScale,
      }}
      initial={{ y: '-12vh', opacity: 0 }}
      animate={{
        y: ['-12vh', '115vh'],
        x: [0, item.drift * 0.3, item.drift, item.drift * 0.6, item.drift * 0.2],
        opacity: [0, opacity, opacity, opacity * 0.85, 0],
      }}
      transition={{
        y: {
          duration: item.duration,
          delay: item.delay,
          repeat: Infinity,
          ease: [0.36, 0.02, 0.72, 0.98],
        },
        x: {
          duration: item.duration,
          delay: item.delay,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        opacity: {
          duration: item.duration,
          delay: item.delay,
          repeat: Infinity,
          times: [0, 0.06, 0.88, 0.97, 1],
        },
      }}
    >
      <motion.div
        style={{ transformStyle: 'preserve-3d' }}
        animate={{
          rotateY: [0, 180 * item.spinDir, 360 * item.spinDir, 540 * item.spinDir, 720 * item.spinDir],
          rotateX: [0, 15 * item.spinDir, -10 * item.spinDir, 12 * item.spinDir, 0],
          rotateZ: [0, 8, -6, 4, 0],
        }}
        transition={{
          duration: item.duration * 0.85,
          delay: item.delay,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <GoldCoin size={item.size} uid={item.id} />
      </motion.div>
    </motion.div>
  );
}

/** Chuva de dinheiro realista — login */
export default function MoneyRain() {
  const items = useMemo(
    () => [...createBills(BILL_COUNT), ...createCoins(COIN_COUNT)],
    [],
  );

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none z-[1]"
      style={{ perspective: '1400px', perspectiveOrigin: '50% -10%' }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(16,185,129,0.08)_0%,transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.4)_100%)]" />

      {items.map((item) =>
        item.kind === 'bill' ? (
          <FallingBill key={item.id} item={item} />
        ) : (
          <FallingCoin key={item.id} item={item} />
        ),
      )}
    </div>
  );
}
