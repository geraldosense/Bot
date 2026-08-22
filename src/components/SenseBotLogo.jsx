/** Logo Sense Bot — PNG com fundo transparente */
export default function SenseBotLogo({
  className = 'h-28 w-28',
  alt = 'Sense Bot',
  variant = 'default',
  align = 'center',
}) {
  const isHeader = variant === 'header';

  const img = (
    <img
      src="/logo-sense-bot-transparent.png"
      alt={alt}
      draggable={false}
      className={`block object-contain object-center select-none bg-transparent ${className}`}
      style={{
        filter: isHeader
          ? 'drop-shadow(0 2px 10px rgba(99, 102, 241, 0.4))'
          : 'drop-shadow(0 4px 14px rgba(56, 189, 248, 0.28))',
      }}
    />
  );

  if (align === 'start') {
    return img;
  }

  return (
    <div className="flex w-full items-center justify-center">{img}</div>
  );
}
