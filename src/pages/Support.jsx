import { MessageCircle } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import WhatsAppGroupCard from '../components/WhatsAppGroupCard';

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
    a: 'Regista-te no site, entra no grupo WhatsApp oficial e aguarda que o Proprietário aprove o teu acesso VIP.',
  },
];

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
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Suporte</h1>
            <p className="text-zinc-500 text-xs">Estamos aqui para ajudar</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-zinc-300 text-sm mb-3">Precisas de ajuda rápida?</p>
          <WhatsAppGroupCard />
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
