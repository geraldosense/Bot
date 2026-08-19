/** Etiquetas visíveis — role técnico `super_admin` = Proprietário */
export const ROLE_LABELS = {
  super_admin: 'Proprietário',
  admin: 'Administrador',
  vip: 'Membro VIP',
  member: 'Membro',
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

export const OWNER_ACCESS_ERROR = 'Acesso Proprietário necessário';
