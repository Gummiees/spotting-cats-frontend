export interface Note {
  id: string;
  forUser: string;
  fromUser?: string;
  note: string;
  createdAt: Date;
  updatedAt?: Date;
}
