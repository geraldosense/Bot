import { WhatsAppIcon } from './WhatsAppGroupCard';
import { getWhatsAppGroupJoinUrl, WHATSAPP_GROUP_NAME } from '../config/community';

/** Link compacto para o grupo WhatsApp oficial */
export default function WhatsAppGroupLink({
  label = 'Entrar no grupo WhatsApp',
  className = '',
  fullWidth = true,
}) {
  return (
    <a
      href={getWhatsAppGroupJoinUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl text-white font-bold text-sm transition-transform active:scale-[0.98] shadow-lg shadow-emerald-900/25 ${
        fullWidth ? 'w-full py-3' : 'px-4 py-2.5'
      } ${className}`}
      style={{
        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
      }}
    >
      <WhatsAppIcon className="w-5 h-5 shrink-0" />
      <span>{label}</span>
    </a>
  );
}

export { WHATSAPP_GROUP_NAME };
