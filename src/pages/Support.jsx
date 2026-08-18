import { MessageCircle, Send } from 'lucide-react';
import BottomNav from '../components/BottomNav';

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
    a: 'Regista-te com email e aguarda que um administrador aprove o teu acesso ao grupo VIP.',
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
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Suporte</h1>
            <p className="text-zinc-500 text-xs">Estamos aqui para ajudar</p>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-700 rounded-xl p-4 mb-6">
          <p className="text-zinc-300 text-sm mb-3">Precisas de ajuda rápida?</p>
          <a
            href="https://t.me/hackerxsuporte"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm"
          >
            <Send className="w-4 h-4" />
            Suporte Telegram
          </a>
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
