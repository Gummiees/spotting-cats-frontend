export interface Note {
  id: string;
  forUser: string;
  byUser: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}
