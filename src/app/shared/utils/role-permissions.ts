import { UserRole } from "@models/user-roles";

export function isAdminOrSuperadmin(role: UserRole): boolean {
  return role === "admin" || role === "superadmin";
}

export function hasPermissionToBan(
  loggedInUserRole: UserRole,
  userRole: UserRole
): boolean {
  switch (loggedInUserRole) {
    case "superadmin":
      return userRole !== "superadmin";
    case "admin":
      return isAdminOrSuperadmin(userRole);
    case "moderator":
      return userRole === "user";
    default:
      return false;
  }
}
