export type UserRole = "ADMIN" | "USER";

export type EventVisibility = "ALL_USERS" | "SPECIFIC_GROUP";

export type MeResponse = {
  id: number;
  username: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

export type LoginResponse = {
  token: string;
  username: string;
  role: UserRole;
};

export type UserSummaryResponse = {
  id: number;
  username: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

export type GroupResponse = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
};

export type EventResponse = {
  id: number;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  visibility: EventVisibility;
  targetGroupId: number | null;
  targetGroupName: string | null;
  createdByUsername: string;
};
