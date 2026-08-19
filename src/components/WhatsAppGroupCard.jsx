import { useState } from 'react';
import { Users, ExternalLink, Check } from 'lucide-react';
import {
  WHATSAPP_GROUP_NAME,
  WHATSAPP_SUPPORT_MESSAGE,
  getWhatsAppGroupJoinUrl,
  openWhatsAppGroupSupport,
} from '../config/community';

export function WhatsAppIcon({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/**
 * Cartão padrão — grupo WhatsApp (Perfil, VIP, Dashboard, Auth, Suporte)
 */
export default function WhatsAppGroupCard({
  title = 'Grupo oficial WhatsApp',
  description = 'Junta-te à comunidade Sense Bot para avisos, suporte e acesso VIP.',
  buttonLabel = 'Entrar no grupo WhatsApp',
  compact = false,
  showHint = true,
  mode = 'group',
  variant = 'card',
}) {
  const isSupport = mode === 'support';
  const inline = variant === 'inline';
  const [sentHint, setSentHint] = useState(false);

  const handleSupportClick = async () => {
    const { copied } = await openWhatsAppGroupSupport();
    setSentHint(true);
    if (!copied) return;
    setTimeout(() => setSentHint(false), 6000);
  };

  const buttonClass = `flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-white font-bold text-sm transition-transform active:scale-[0.98] ${
    isSupport ? 'shadow-lg shadow-purple-900/40' : 'shadow-lg shadow-emerald-900/30'
  }`;

  const buttonStyle = {
    background: isSupport
      ? 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)'
      : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
  };

  const inner = (
    <>
      {!inline && (title || description) && (
        <div>
          {title && <p className="text-white font-bold text-sm">{title}</p>}
          {description && (
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{description}</p>
          )}
        </div>
      )}

      {isSupport ? (
        <button type="button" onClick={handleSupportClick} className={buttonClass} style={buttonStyle}>
          <WhatsAppIcon className="w-5 h-5" />
          {buttonLabel}
          <ExternalLink className="w-4 h-4 opacity-80" />
        </button>
      ) : (
        <a
          href={getWhatsAppGroupJoinUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          style={buttonStyle}
        >
          <WhatsAppIcon className="w-5 h-5" />
          {buttonLabel}
        </a>
      )}

      {showHint && (
        <div
          className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border ${
            sentHint
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : isSupport
                ? 'bg-purple-500/10 border-purple-500/25'
                : 'bg-emerald-500/10 border-emerald-500/25'
          }`}
        >
          {sentHint ? (
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <Users
              className={`w-4 h-4 shrink-0 mt-0.5 ${isSupport ? 'text-purple-400' : 'text-emerald-400'}`}
            />
          )}
          <p
            className={`text-[11px] leading-relaxed ${
              sentHint
                ? 'text-emerald-200/90'
                : isSupport
                  ? 'text-purple-200/90'
                  : 'text-emerald-200/90'
            }`}
          >
            {sentHint ? (
              <>
                Grupo <span className="font-bold text-emerald-300">{WHATSAPP_GROUP_NAME}</span>{' '}
                aberto! Cola a mensagem copiada no chat e envia.
              </>
            ) : isSupport ? (
              <>
                Abre o grupo{' '}
                <span className="font-bold text-purple-300">{WHATSAPP_GROUP_NAME}</span> e copia
                automaticamente:{' '}
                <span className="font-bold text-purple-300">&quot;{WHATSAPP_SUPPORT_MESSAGE}&quot;</span>
              </>
            ) : (
              <>
                <span className="font-bold text-emerald-300">{WHATSAPP_GROUP_NAME}</span> — grupo
                exclusivo da comunidade. Toque no botão para entrar no WhatsApp.
              </>
            )}
          </p>
        </div>
      )}
    </>
  );

  if (inline) {
    return <div className="space-y-3">{inner}</div>;
  }

  return (
    <div
      className={`bg-zinc-900/60 border border-zinc-700 rounded-xl space-y-4 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      {inner}
    </div>
  );
}
