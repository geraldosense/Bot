/** Logo Sense Bot — PNG com fundo transparente (sem borda preta) */
export default function SenseBotLogo({
  className = 'h-28 w-28',
  alt = 'Sense Bot',
  variant = 'default',
}) {
  const isHeader = variant === 'header';

  return (
    <img
      src="/logo-sense-bot-transparent.png"
      alt={alt}
      draggable={false}
      className={`object-contain select-none mx-auto bg-transparent ${className}`}
      style={{
        filter: isHeader
          ? 'drop-shadow(0 2px 8px rgba(99, 102, 241, 0.35))'
          : 'drop-shadow(0 4px 12px rgba(56, 189, 248, 0.25))',
      }}
    />
  );
}
