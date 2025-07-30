import { UserRole } from "@models/user-roles";

export function isPrivilegedRole(role: UserRole): boolean {
  return role === "admin" || role === "superadmin" || role === "moderator";
}

export function isAdminOrSuperadmin(role: UserRole): boolean {
  return role === "admin" || role === "superadmin";
}

export function hasPermissionOverUser({
  loggedInUserRole,
  userRole,
}: {
  loggedInUserRole: UserRole;
  userRole: UserRole;
}): boolean {
  switch (userRole) {
    case "superadmin":
      return false;
    case "admin":
      return loggedInUserRole === "superadmin";
    case "moderator":
      return isAdminOrSuperadmin(loggedInUserRole);
    default:
      return loggedInUserRole !== "user";
  }
}
