import SenseBotLogo from './SenseBotLogo';

const THEMES = {
  vip: {
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #6366F1)',
    border: 'border-purple-500/20',
    glow: 'bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.14),transparent_60%)]',
    maxWidth: 'max-w-4xl',
    logo: 'h-[4.25rem] w-[4.25rem] sm:h-[5.25rem] sm:w-[5.25rem]',
  },
  member: {
    background: 'linear-gradient(135deg, #312E81 0%, #4C1D95 50%, #1E1B4B 100%)',
    border: 'border-indigo-500/20',
    glow: 'bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.1),transparent_55%)]',
    maxWidth: 'max-w-lg',
    logo: 'h-[4rem] w-[4rem] sm:h-[5rem] sm:w-[5rem]',
  },
};

/** Cabeçalho com logo centrado e slot opcional à direita */
export default function SiteHeader({ theme = 'vip', rightSlot = null, logoClassName }) {
  const t = THEMES[theme] || THEMES.vip;

  return (
    <header
      className={`relative overflow-hidden border-b ${t.border} shadow-lg shadow-black/20`}
      style={{ background: t.background }}
    >
      <div className={`absolute inset-0 pointer-events-none ${t.glow}`} />

      <div
        className={`relative ${t.maxWidth} mx-auto px-4 py-3 sm:py-4 min-h-[4.75rem] sm:min-h-[5.5rem] flex items-center justify-center`}
      >
        <SenseBotLogo
          variant="header"
          className={logoClassName || t.logo}
          align="center"
        />

        {rightSlot ? (
          <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10">
            {rightSlot}
          </div>
        ) : null}
      </div>
    </header>
  );
}
