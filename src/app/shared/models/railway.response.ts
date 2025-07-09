export interface RailwayResponse<T> {
  data: T;
  success: boolean;
  message: string;
  timestamp: string;
}
