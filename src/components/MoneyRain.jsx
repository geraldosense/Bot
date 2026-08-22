import { useMemo } from 'react';

const COUNT = 22;

function Bill({ size, uid }) {
  const gradId = `billGrad-${uid}`;
  return (
    <svg
      width={size}
      height={size * 0.55}
      viewBox="0 0 48 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_2px_8px_rgba(16,185,129,0.35)]"
    >
      <rect x="0.5" y="0.5" width="47" height="25" rx="2.5" fill={`url(#${gradId})`} stroke="#34D399" strokeOpacity="0.5" />
      <rect x="4" y="4" width="40" height="18" rx="1" stroke="#6EE7B7" strokeOpacity="0.25" strokeWidth="0.5" fill="none" />
      <circle cx="24" cy="13" r="5" stroke="#A7F3D0" strokeOpacity="0.4" strokeWidth="0.75" fill="none" />
      <text x="24" y="15.5" textAnchor="middle" fill="#ECFDF5" fontSize="7" fontWeight="700" opacity="0.85">
        $
      </text>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="48" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#065F46" />
          <stop offset="0.5" stopColor="#059669" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Coin({ size, uid }) {
  const gradId = `coinGrad-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_2px_10px_rgba(251,191,36,0.45)]"
    >
      <circle cx="12" cy="12" r="11" fill={`url(#${gradId})`} stroke="#FCD34D" strokeWidth="0.75" strokeOpacity="0.6" />
      <circle cx="12" cy="12" r="7.5" stroke="#FDE68A" strokeOpacity="0.35" strokeWidth="0.5" fill="none" />
      <text x="12" y="15" textAnchor="middle" fill="#78350F" fontSize="9" fontWeight="800">
        $
      </text>
      <defs>
        <linearGradient id={gradId} x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function createItems(count) {
  return Array.from({ length: count }, (_, i) => {
    const isCoin = i % 3 === 0;
    return {
      id: i,
      type: isCoin ? 'coin' : 'bill',
      left: `${(i * 17 + 7) % 94}%`,
      size: isCoin ? 18 + (i % 4) * 3 : 28 + (i % 5) * 4,
      delay: `${(i * 0.65) % 8}s`,
      duration: `${9 + (i % 6) * 1.4}s`,
      opacity: 0.35 + (i % 4) * 0.12,
      blur: i % 5 === 0 ? 1 : 0,
    };
  });
}

/** Chuva de dinheiro — fundo decorativo do login */
export default function MoneyRain() {
  const items = useMemo(() => createItems(COUNT), []);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-black/40" />

      {items.map((item) => (
        <div
          key={item.id}
          className="money-rain-particle absolute top-0 will-change-transform"
          style={{
            left: item.left,
            animationDelay: item.delay,
            animationDuration: item.duration,
            opacity: item.opacity,
            filter: item.blur ? `blur(${item.blur}px)` : undefined,
          }}
        >
          {item.type === 'coin' ? (
            <Coin size={item.size} uid={item.id} />
          ) : (
            <Bill size={item.size} uid={item.id} />
          )}
        </div>
      ))}
    </div>
  );
}
