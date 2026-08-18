/** URLs relativas — Vite faz proxy em dev; Express serve API em produção */
export const API = '';

async function fetchWithTimeout(url, options = {}, ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(`${API}${url}`, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson(path, options = {}) {
  let res;
  try {
    res = await fetchWithTimeout(path, options);
  } catch {
    throw new Error(
      'Servidor indisponível. Inicia o backend com: npm run dev:server (ou npm run dev)'
    );
  }
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
      throw new Error(
        'Servidor indisponível. Inicia o backend com: npm run dev:server (ou npm run dev)'
      );
    }
    throw new Error(text.slice(0, 120) || 'Resposta inválida do servidor');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro no pedido');
  }
  return data;
}
