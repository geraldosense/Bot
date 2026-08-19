import { getColorConfig } from '../utils/bacBoStats';

const FALLBACK = {
  gradient: 'linear-gradient(180deg, #52525B 0%, #3F3F46 100%)',
  glow: 'rgba(113, 113, 122, 0.4)',
};

/**
 * Esfera 3D — cores reais Evolution Bac Bo (Azul / Vermelho / Amarelo)
 */
export default function BacBoColorSphere({ zone, size = 'md', className = '' }) {
  const config = zone ? getColorConfig(zone) : null;
  const px = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;

  const gradient = config?.gradient || FALLBACK.gradient;
  const glow = config?.glow || FALLBACK.glow;

  return (
    <span
      className={`inline-block rounded-full shrink-0 ${className}`}
      style={{
        width: px,
        height: px,
        background: gradient,
        boxShadow: `
          0 2px 4px rgba(0,0,0,0.45),
          0 0 10px ${glow},
          inset 0 -2px 4px rgba(0,0,0,0.25),
          inset 0 2px 3px rgba(255,255,255,0.35)
        `,
      }}
      title={config ? `${config.emoji} ${config.bet}` : '—'}
      aria-hidden
    />
  );
}

export function BacBoColorSphereRow({ zones = [], size = 'md', gap = 'gap-1.5' }) {
  if (!zones.length) {
    return <span className="text-zinc-600 text-[10px] font-medium">—</span>;
  }

  return (
    <span className={`inline-flex items-center ${gap}`}>
      {zones.map((zone, i) => (
        <BacBoColorSphere key={`${zone}-${i}`} zone={zone} size={size} />
      ))}
    </span>
  );
}
