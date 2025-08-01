interface BaseCat {
  xCoordinate: number;
  yCoordinate: number;
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
}

export interface Cat extends BaseCat {
  id: string;
  totalLikes: number;
  imageUrls: string[];
  isUserOwner: boolean;
  isLiked: boolean;
  username?: string;
  createdAt: Date;
  updatedAt?: Date;
  confirmedOwnerAt?: Date;
}

export interface CreateCat extends BaseCat {}

export interface UpdateCat extends BaseCat {
  replaceImages?: boolean;
  keepImages?: string[];
}
