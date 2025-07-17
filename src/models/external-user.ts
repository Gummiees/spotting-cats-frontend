import { BanType } from "./ban-types";
import { UserRole } from "./user-roles";

export interface ExternalUser {
  username: string;
  avatarUrl: string;
  role: UserRole;
  isInactive: boolean;
  isBanned: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt?: Date;
  emailUpdatedAt?: Date;
  usernameUpdatedAt?: Date;
  avatarUpdatedAt?: Date;
}
