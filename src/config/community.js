/** Grupo oficial Sense Bot — única fonte para links WhatsApp no site */
export const WHATSAPP_GROUP_URL =
  'https://chat.whatsapp.com/HYP3IE3Iycc0sUgKl2oGpd';

export const WHATSAPP_GROUP_NAME = 'Make money';

/** Mensagem automática ao pedir suporte */
export const WHATSAPP_SUPPORT_MESSAGE =
  'Olá! Vim da Sense Bot, e gostaria de saber como funciona.';

/** Abre WhatsApp com mensagem pré-preenchida — utilizador escolhe o grupo e envia */
export function getWhatsAppSupportUrl(message = WHATSAPP_SUPPORT_MESSAGE) {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

/** Link directo para entrar no grupo (sem mensagem) */
export function getWhatsAppGroupJoinUrl() {
  return WHATSAPP_GROUP_URL;
}
