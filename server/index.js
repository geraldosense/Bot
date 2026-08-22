import { createApp } from './createApp.js';

const PORT = process.env.PORT || 3001;

const { httpServer, casino, vercel } = await createApp({ vercel: false });

if (vercel) {
  console.error('server/index.js não deve correr em modo Vercel — usa api/index.js');
  process.exit(1);
}

httpServer.listen(PORT, '0.0.0.0', async () => {
  await casino.start();
  const base = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log(`🎰 Sense Bot — Evolution Casino LIVE`);
  console.log(`   ${base}`);
  console.log(`   Auth: login → registo → aprovação VIP`);
});

process.on('SIGINT', () => {
  casino.stop();
  process.exit(0);
});
