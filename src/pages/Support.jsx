import { MessageCircle, Users } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/HYP3IE3Iycc0sUgKl2oGpd';

const FAQ = [
  {
    q: 'Como funcionam os sinais?',
    a: 'A IA analisa a mesa Evolution Bac Bo em tempo real e envia sinais confirmados quando identifica padrões válidos.',
  },
  {
    q: 'Os sinais são 100% garantidos?',
    a: 'Não. São ferramentas de análise baseadas em dados reais do casino. Joga com responsabilidade.',
  },
  {
    q: 'Como me torno VIP?',
    a: 'Regista-te no site, entra no grupo WhatsApp oficial e aguarda que o Chef Máximo aprove o teu acesso VIP.',
  },
];

function WhatsAppIcon({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Support() {
  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #0a1628 0%, #050505 50%, #000 100%)',
      }}
    >
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Suporte</h1>
            <p className="text-zinc-500 text-xs">Estamos aqui para ajudar</p>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-700 rounded-xl p-4 mb-6 space-y-4">
          <div>
            <p className="text-white font-bold text-sm">Grupo oficial WhatsApp</p>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
              Junta-te à comunidade Sense Bot para avisos, suporte e acesso VIP.
            </p>
          </div>

          <a
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition-transform active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            }}
          >
            <WhatsAppIcon className="w-5 h-5" />
            Entrar no grupo WhatsApp
          </a>

          <div className="flex items-start gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3 py-2.5">
            <Users className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-emerald-200/90 text-[11px] leading-relaxed">
              <span className="font-bold text-emerald-300">Make money</span> — grupo exclusivo da
              comunidade. Toque no botão verde acima para abrir o WhatsApp e pedir entrada.
            </p>
          </div>
        </div>

        <h2 className="text-white font-bold text-sm mb-3">Central de Ajuda</h2>
        <div className="space-y-2">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl group"
            >
              <summary className="px-4 py-3 text-white text-sm font-medium cursor-pointer list-none flex justify-between items-center">
                {item.q}
                <span className="text-zinc-500 group-open:rotate-90 transition-transform">›</span>
              </summary>
              <p className="px-4 pb-3 text-zinc-400 text-xs">{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
