export interface Note {
  id: string;
  forUser: string;
  byUser: string;
  note: string;
  createdAt: Date;
  updatedAt?: Date;
}
