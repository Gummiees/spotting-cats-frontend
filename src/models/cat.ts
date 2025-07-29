export interface Cat {
  id: string;
  totalLikes: number;
  imageUrls: string[];
  xCoordinate: number;
  yCoordinate: number;
  isUserOwner: boolean;
  userId?: string;
  protectorId?: string;
  colonyId?: string;
  name?: string;
  age?: number;
  breed?: string;
  extraInfo?: string;
  isDomestic?: boolean;
  isMale?: boolean;
  isSterilized?: boolean;
  isFriendly?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  confirmedOwnerAt?: Date;
}
