export const IS_VERCEL = !!process.env.VERCEL;

/** Entrada única — Vercel usa app leve; Render/local usa servidor completo. */
export async function createApp(options = {}) {
  const vercel = options.vercel ?? IS_VERCEL;
  if (vercel) {
    const { createVercelApp } = await import('./createVercelApp.js');
    return createVercelApp();
  }
  const { createNodeApp } = await import('./createNodeApp.js');
  return createNodeApp();
}
