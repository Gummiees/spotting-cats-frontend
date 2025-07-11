export interface Cat {
  id: string;
  userId?: string;
  protectorId?: string;
  colonyId?: string;
  totalLikes: number;
  name?: string;
  age?: number;
  breed?: string;
  imageUrls: string[];
  xCoordinate: number;
  yCoordinate: number;
  extraInfo?: string;
  isDomestic?: boolean;
  isMale?: boolean;
  isSterilized?: boolean;
  isFriendly?: boolean;
  isUserOwner: boolean;
  createdAt: Date;
  updatedAt?: Date;
  confirmedOwnerAt?: Date;
}
