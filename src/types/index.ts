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

export interface ReplyTo {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image';
  fileUrl?: string;
  fileName?: string;
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
  status?: MessageStatus;
  replyTo?: ReplyTo;
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

export interface Conversation {
  id: string;
  name: string;
  type: 'group' | 'dm';
  avatarUrl?: string;
  lastMessage?: string;
  lastTime?: string;
  unread?: number;
  online?: boolean;
  members?: number;
}

export interface FriendRequest {
  id: string;
  sender: User;
  receiver: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
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

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
export type Theme = 'light' | 'dark' | 'system';
