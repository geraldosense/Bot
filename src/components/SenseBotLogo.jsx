/** Logo Sense Bot — header preenche interior transparente, sem borda exterior */
export default function SenseBotLogo({
  className = 'h-28 w-28',
  alt = 'Sense Bot',
  variant = 'default',
}) {
  const isHeader = variant === 'header';

  return (
    <img
      src={isHeader ? '/logo-sense-bot-header.png' : '/logo-sense-bot-transparent.png'}
      alt={alt}
      draggable={false}
      className={`object-contain select-none mx-auto ${className}`}
      style={{
        filter: isHeader
          ? 'drop-shadow(0 4px 14px rgba(0, 0, 0, 0.35))'
          : 'drop-shadow(0 4px 12px rgba(56, 189, 248, 0.25))',
      }}
    />
  );
}
