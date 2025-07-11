export interface ExternalUser {
  username: string;
  avatarUrl: string;
  isAdmin: boolean;
  isInactive: boolean;
  isBanned: boolean;
  lastLoginAt: Date;
  createdAt: Date;
}
