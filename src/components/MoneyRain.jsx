import { useMemo } from 'react';
import { motion } from 'framer-motion';

const COUNT = 36;

function Bill({ size, uid }) {
  const gradId = `bill-${uid}`;
  return (
    <svg
      width={size}
      height={size * 0.52}
      viewBox="0 0 56 29"
      fill="none"
      aria-hidden
      className="select-none"
      style={{ filter: 'drop-shadow(0 4px 12px rgba(250,204,21,0.45))' }}
    >
      <rect width="56" height="29" rx="3" fill={`url(#${gradId})`} />
      <rect x="3" y="3" width="50" height="23" rx="2" stroke="#FEF9C3" strokeOpacity="0.45" strokeWidth="0.75" fill="none" />
      <circle cx="28" cy="14.5" r="6" stroke="#FEF08A" strokeOpacity="0.5" strokeWidth="0.75" fill="none" />
      <text x="28" y="17.5" textAnchor="middle" fill="#422006" fontSize="9" fontWeight="800">
        $
      </text>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="56" y2="29">
          <stop stopColor="#FDE047" />
          <stop offset="0.45" stopColor="#FACC15" />
          <stop offset="1" stopColor="#EAB308" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Coin({ size, uid }) {
  const gradId = `coin-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
      className="select-none"
      style={{ filter: 'drop-shadow(0 4px 14px rgba(251,191,36,0.55))' }}
    >
      <circle cx="14" cy="14" r="13" fill={`url(#${gradId})`} stroke="#FEF3C7" strokeWidth="1" />
      <text x="14" y="18" textAnchor="middle" fill="#78350F" fontSize="11" fontWeight="900">
        $
      </text>
      <defs>
        <radialGradient id={gradId} cx="40%" cy="35%" r="65%">
          <stop stopColor="#FDE68A" />
          <stop offset="0.55" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#B45309" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function createItems(count) {
  return Array.from({ length: count }, (_, i) => {
    const isCoin = i % 4 === 0;
    return {
      id: i,
      type: isCoin ? 'coin' : 'bill',
      left: `${4 + ((i * 23) % 92)}%`,
      size: isCoin ? 22 + (i % 3) * 6 : 38 + (i % 4) * 8,
      delay: (i * 0.35) % 6,
      duration: 7 + (i % 5) * 1.2,
      drift: i % 2 === 0 ? 28 : -24,
      startRotate: -25 + (i % 7) * 8,
      endRotate: 15 + (i % 5) * 12,
      layer: i % 3,
    };
  });
}

function FallingItem({ item }) {
  const scale = item.layer === 0 ? 1 : item.layer === 1 ? 0.85 : 0.7;
  const baseOpacity = item.layer === 0 ? 0.95 : item.layer === 1 ? 0.75 : 0.55;

  return (
    <motion.div
      className="absolute top-0"
      style={{
        left: item.left,
        zIndex: item.layer,
        scale,
      }}
      initial={{
        y: '-8vh',
        x: 0,
        rotate: item.startRotate,
        opacity: 0,
      }}
      animate={{
        y: ['-8vh', '8vh', '55vh', '92vh', '108vh'],
        x: [0, item.drift * 0.35, item.drift, item.drift * 0.5, item.drift * 0.2],
        rotate: [item.startRotate, item.endRotate * 0.6, item.endRotate, item.startRotate * -0.3, item.endRotate * 0.8],
        opacity: [0, baseOpacity, baseOpacity, baseOpacity * 0.85, 0],
      }}
      transition={{
        duration: item.duration,
        delay: item.delay,
        repeat: Infinity,
        ease: 'linear',
        times: [0, 0.08, 0.75, 0.92, 1],
      }}
    >
      {item.type === 'coin' ? (
        <Coin size={item.size} uid={item.id} />
      ) : (
        <Bill size={item.size} uid={item.id} />
      )}
    </motion.div>
  );
}

/** Chuva de dinheiro — fundo animado do login */
export default function MoneyRain() {
  const items = useMemo(() => createItems(COUNT), []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]" aria-hidden="true">
      {/* Vinheta suave — não tapa o dinheiro */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />

      {items.map((item) => (
        <FallingItem key={item.id} item={item} />
      ))}
    </div>
  );
}
