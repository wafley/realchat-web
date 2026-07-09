export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  sender?: User;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  members: GroupMember[];
  creatorId: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt?: Date;
  lastMessage?: Message;
}

export interface GroupMember {
  id: string;
  userId: string;
  user?: User;
  groupId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  fullName: string;
  password: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type Theme = 'light' | 'dark' | 'system';
