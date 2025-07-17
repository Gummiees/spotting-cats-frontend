import { BanType } from "./ban-types";
import { UserRole } from "./user-roles";

export interface ExternalUser {
  id?: string;
  username: string;
  avatarUrl: string;
  role: UserRole;
  isInactive: boolean;
  isBanned: boolean;
  banType?: BanType;
  banReason?: string;
  bannedBy?: string;
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
