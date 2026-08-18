/** Logo Bac Bo Live — fundo transparente */
export default function BacBoLogo({ className = 'h-28 w-auto max-w-full', alt = 'BAC BO Live' }) {
  return (
    <img
      src="/logo-bacbo-live-transparent.png"
      alt={alt}
      draggable={false}
      className={`object-contain select-none mx-auto ${className}`}
      style={{
        filter: 'drop-shadow(0 4px 16px rgba(234, 179, 8, 0.2))',
      }}
    />
  );
}
