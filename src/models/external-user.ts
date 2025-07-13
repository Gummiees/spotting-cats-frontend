import { UserRole } from "./user-roles";

export interface ExternalUser {
  username: string;
  avatarUrl: string;
  role: UserRole;
  isInactive: boolean;
  isBanned: boolean;
  lastLoginAt: Date;
  createdAt: Date;
}
