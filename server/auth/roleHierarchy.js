/** Hierarquia: Proprietário > Gerente > Admin > VIP > Membro */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  ADMIN: 'admin',
  VIP: 'vip',
  MEMBER: 'member',
};

export const ROLE_RANK = {
  [ROLES.SUPER_ADMIN]: 4,
  [ROLES.MANAGER]: 3,
  [ROLES.ADMIN]: 2,
  [ROLES.VIP]: 1,
  [ROLES.MEMBER]: 0,
};

export const MANAGER_PERMISSIONS = {
  can_request_vip: true,
  can_view_active_users: true,
  can_manage_admins: true,
};

export function isSuperAdmin(user) {
  return user?.role === ROLES.SUPER_ADMIN;
}

export function isManager(user) {
  return user?.role === ROLES.MANAGER;
}

export function isManagerOrAbove(user) {
  return [ROLES.SUPER_ADMIN, ROLES.MANAGER].includes(user?.role);
}

export function isAdminRole(user) {
  return user?.role === ROLES.ADMIN;
}

export function isAdminOrAbove(user) {
  return [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ADMIN].includes(user?.role);
}

export function isVipOrAbove(user) {
  return [ROLES.VIP, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN].includes(user?.role);
}

export function hasPermission(user, permission) {
  if (!user) return false;
  if (isSuperAdmin(user) || isManager(user)) return true;
  if (user.role === ROLES.ADMIN) return !!user.permissions?.[permission];
  return false;
}

/** Proprietário e Gerente nunca podem ser alterados por níveis inferiores */
export function assertActorCanModifyTarget(actor, target) {
  if (!target) throw new Error('Utilizador não encontrado');

  if (target.role === ROLES.SUPER_ADMIN) {
    throw new Error('O Proprietário é intocável e nunca pode ser exonerado ou rebaixado');
  }

  if (target.role === ROLES.MANAGER && !isSuperAdmin(actor)) {
    throw new Error('Só o Proprietário pode alterar um Gerente');
  }

  const actorRank = ROLE_RANK[actor?.role] ?? -1;
  const targetRank = ROLE_RANK[target.role] ?? -1;

  if (targetRank >= actorRank && !isSuperAdmin(actor)) {
    throw new Error('Não tens permissão para alterar este utilizador');
  }
}

export function isProtectedRole(role) {
  return role === ROLES.SUPER_ADMIN;
}
