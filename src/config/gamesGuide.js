/** Guias dos jogos disponíveis no Sense Bot */
export const SITE_GAMES_GUIDE = [
  {
    id: 'bac-bo',
    name: 'Bac Bo',
    image: '/games/bac-bo.png',
    topic: 'O que significam os sinais?',
    active: true,
    category: 'Cartas',
    content: [
      'O Bac Bo é um jogo Evolution com três resultados: Azul (Jogador), Vermelho (Casa) e Empate (Amarelo).',
      'A IA Sense Bot analisa a mesa em tempo real e envia sinais quando identifica um padrão válido.',
      'Estados do sinal: ANALISANDO → ENTRADA CONFIRMADA (cor recomendada) → resultado GREEN ou RED.',
      'Após falhar a entrada, activa-se o sistema de gales (1°, 2° e 3°) mantendo a mesma cor.',
      'No histórico: Aposta = cor recomendada · Seq = últimas 3 cores da mesa · esferas = rodadas da jogada.',
    ],
  },
  {
    id: 'football-studio',
    name: 'Football Studio Dice',
    image: '/games/football-studio.png',
    topic: 'Como funciona?',
    active: false,
    category: 'Cartas',
    content: [
      'Football Studio Dice combina dados com apostas Casa vs Visitante, estilo futebol ao vivo.',
      'O robô Sense Bot para este jogo está em desenvolvimento e será disponibilizado para membros VIP.',
      'Enquanto aguardas, usa o Bac Bo — já activo com sinais em tempo real.',
    ],
  },
  {
    id: 'aviator',
    name: 'Aviator',
    image: '/games/aviator.png',
    topic: 'Como funciona?',
    active: false,
    category: 'Crash',
    content: [
      'Aviator é um jogo crash — o multiplicador sobe até o avião voar embora.',
      'A IA para Aviator será integrada em breve no Sense Bot com análise de padrões e alertas VIP.',
      'Regista-te e entra no grupo WhatsApp para seres avisado quando estiver disponível.',
    ],
  },
  {
    id: 'roulette',
    name: 'Roleta',
    image: '/games/roleta.png',
    topic: 'Como funciona?',
    active: false,
    category: 'Roleta',
    content: [
      'Roleta Evolution com análise de tendências e zonas quentes/frias.',
      'Este módulo está planeado para uma actualização futura do Sense Bot.',
      'Membros VIP terão acesso prioritário quando o robô de Roleta for lançado.',
    ],
  },
];
