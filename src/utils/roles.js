/** Etiquetas visíveis na interface */
export const ROLE_LABELS = {
  super_admin: 'Proprietário',
  manager: 'Gerente',
  admin: 'Administrador',
  vip: 'Membro VIP',
  member: 'Membro',
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

export const OWNER_ACCESS_ERROR = 'Acesso Proprietário necessário';
export const STAFF_ACCESS_ERROR = 'Acesso Proprietário ou Gerente necessário';

/** Proprietário > Gerente > Admin > VIP > Membro */
export const ROLE_RANK = {
  super_admin: 4,
  manager: 3,
  admin: 2,
  vip: 1,
  member: 0,
};

export function isOwnerRole(role) {
  return role === 'super_admin';
}

export function isManagerRole(role) {
  return role === 'manager';
}

export function isStaffRole(role) {
  return ['admin', 'manager', 'super_admin'].includes(role);
}

export function canManageAccountsRole(role) {
  return ['manager', 'super_admin'].includes(role);
}
