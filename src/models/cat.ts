interface BaseCat {
  xCoordinate: number;
  yCoordinate: number;
  protectorId?: string | null;
  colonyId?: string | null;
  name?: string | null;
  age?: number | null;
  breed?: string | null;
  extraInfo?: string | null;
  isDomestic?: boolean | null;
  isMale?: boolean | null;
  isSterilized?: boolean | null;
  isFriendly?: boolean | null;
}

export interface Cat extends BaseCat {
  id: string;
  totalLikes: number;
  imageUrls: string[];
  isUserOwner: boolean;
  isLiked: boolean;
  username?: string | null;
  address?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
  confirmedOwnerAt?: Date | null;
}

export interface CreateCat extends BaseCat {}

export interface UpdateCat extends BaseCat {
  replaceImages?: boolean | null;
  keepImages?: string[] | null;
}
