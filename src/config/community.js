/** Grupo oficial Sense Bot — Make money💰 */
export const WHATSAPP_GROUP_URL =
  'https://chat.whatsapp.com/HYP3IE3Iycc0sUgKl2oGpd';

export const WHATSAPP_GROUP_NAME = 'Make money💰';

/** Mensagem automática ao pedir suporte */
export const WHATSAPP_SUPPORT_MESSAGE =
  'Olá! Vim da Sense Bot, e gostaria de saber como funciona.';

/** Link directo para o grupo */
export function getWhatsAppGroupJoinUrl() {
  return WHATSAPP_GROUP_URL;
}

/** Copia mensagem e abre o grupo Make money no WhatsApp */
export async function openWhatsAppGroupSupport(
  message = WHATSAPP_SUPPORT_MESSAGE,
) {
  let copied = false;

  try {
    await navigator.clipboard.writeText(message);
    copied = true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = message;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      copied = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch {
      copied = false;
    }
  }

  window.open(WHATSAPP_GROUP_URL, '_blank', 'noopener,noreferrer');
  return { copied, message };
}
