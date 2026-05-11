export type UraiEvent = {
  userId: string;
  type: string;
  timestamp: string | number;
  payload: Record<string, unknown>;
};
