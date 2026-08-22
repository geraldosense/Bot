import SenseBotLogo from './SenseBotLogo';

const THEMES = {
  vip: {
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #6366F1)',
    border: 'border-purple-500/20',
    glow: 'bg-[radial-gradient(circle_at_15%_50%,rgba(255,255,255,0.14),transparent_55%)]',
    maxWidth: 'max-w-4xl',
    logo: 'h-16 w-16 sm:h-20 sm:w-20',
  },
  member: {
    background: 'linear-gradient(135deg, #312E81 0%, #4C1D95 50%, #1E1B4B 100%)',
    border: 'border-indigo-500/20',
    glow: 'bg-[radial-gradient(circle_at_15%_50%,rgba(255,255,255,0.1),transparent_55%)]',
    maxWidth: 'max-w-lg',
    logo: 'h-14 w-14 sm:h-[4.5rem] sm:w-[4.5rem]',
  },
};

/** Cabeçalho — logo à esquerda, acções à direita */
export default function SiteHeader({ theme = 'vip', rightSlot = null, logoClassName }) {
  const t = THEMES[theme] || THEMES.vip;

  return (
    <header
      className={`relative overflow-hidden border-b ${t.border} shadow-lg shadow-black/20`}
      style={{ background: t.background }}
    >
      <div className={`absolute inset-0 pointer-events-none ${t.glow}`} />

      <div
        className={`relative ${t.maxWidth} mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3 min-h-[4.5rem] sm:min-h-[5rem]`}
      >
        <SenseBotLogo
          variant="header"
          className={logoClassName || t.logo}
          align="start"
        />

        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </header>
  );
}
