export interface OwnUser {
  id: string;
  email: string;
  username: string;
  avatarUrl: string;
  isAdmin: boolean;
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
}
