import { UserRole } from "./user-roles";

export interface OwnUser {
  id: string;
  email: string;
  username: string;
  avatarUrl: string;
  role: UserRole;
  isInactive: boolean;
  isBanned: boolean;
  banReason?: string;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt?: Date;
  emailUpdatedAt?: Date;
  usernameUpdatedAt?: Date;
  avatarUpdatedAt?: Date;
  deactivatedAt?: Date;
  bannedAt?: Date;
  roleUpdatedAt?: Date;
  roleUpdatedBy?: string;
}
