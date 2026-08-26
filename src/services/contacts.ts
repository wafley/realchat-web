import type { Contact, User } from '@/types';
import api from '@/lib/api';
import { DEV_USER_ID, MOCK_USERS } from '@/mocks/users';
import { MOCK_CONTACTS } from '@/mocks/contacts';
import { updateConversationName } from '@/mocks/chat';
import { delay } from '@/mocks/utils';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

interface RawContact {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
  customName: string | null;
  createdAt: string;
}

function mapContact(raw: RawContact): Contact {
  return {
    userId: raw.id,
    user: {
      id: raw.id,
      email: '',
      username: raw.username,
      fullName: raw.fullName ?? raw.username,
      avatarUrl: raw.avatarUrl ?? undefined,
      bio: raw.bio ?? undefined,
      status: raw.isOnline ? 'online' : 'offline',
      lastSeen: raw.lastSeenAt ? new Date(raw.lastSeenAt) : undefined,
      createdAt: new Date(raw.createdAt),
    },
    customName: raw.customName ?? undefined,
    addedAt: new Date(raw.createdAt),
  };
}

export async function searchContacts(query: string): Promise<User[]> {
  const q = query.toLowerCase();
  if (DEV_MODE) {
    await delay(300);
    return MOCK_USERS.filter(
      (u) =>
        u.id !== DEV_USER_ID &&
        MOCK_CONTACTS.some((c) => c.userId === u.id) &&
        (u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)),
    );
  }
  const contacts = await getContacts();
  return contacts
    .filter((c) => c.user.fullName.toLowerCase().includes(q) || c.user.username.toLowerCase().includes(q))
    .map((c) => c.user);
}

export async function addContact(username: string, customName?: string): Promise<Contact> {
  const cleanUsername = username.trim().replace(/^@+/, '').toLowerCase();
  if (DEV_MODE) {
    await delay(300);
    const user = MOCK_USERS.find((u) => u.username.toLowerCase() === cleanUsername);
    if (!user) throw new Error('User not found');
    if (MOCK_CONTACTS.some((c) => c.userId === user.id)) throw new Error('Already in contacts');
    const contact: Contact = { userId: user.id, user, customName, addedAt: new Date() };
    MOCK_CONTACTS.push(contact);
    if (customName) updateConversationName(user.id, customName);
    return contact;
  }
  const { data } = await api.post<{
    id?: string;
    contactId?: string;
    customName?: string | null;
    createdAt?: string;
  }>('/contacts/by-username', { username: cleanUsername, customName });
  const targetId = data?.contactId ?? (data as unknown as RawContact)?.id;
  if (!targetId) throw new Error('Failed to add contact: no user id in response');
  return {
    userId: targetId,
    user: {
      id: targetId,
      email: '',
      username: cleanUsername,
      fullName: data?.customName ?? cleanUsername,
      avatarUrl: undefined,
      status: 'offline',
      createdAt: data?.createdAt ? new Date(data.createdAt) : new Date(),
    },
    customName: data?.customName ?? undefined,
    addedAt: data?.createdAt ? new Date(data.createdAt) : new Date(),
  };
}

export async function removeContact(userId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(200);
    const idx = MOCK_CONTACTS.findIndex((c) => c.userId === userId);
    if (idx !== -1) MOCK_CONTACTS.splice(idx, 1);
    return;
  }
  await api.delete(`/contacts/${userId}`);
}

export async function getContacts(): Promise<Contact[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...MOCK_CONTACTS];
  }
  const { data } = await api.get<unknown>('/contacts', { data: {} });
  const rawList = Array.isArray(data)
    ? (data as RawContact[])
    : Array.isArray((data as { data?: RawContact[] })?.data)
      ? (data as { data: RawContact[] }).data
      : Array.isArray((data as { contacts?: RawContact[] })?.contacts)
        ? (data as { contacts: RawContact[] }).contacts
        : [];
  const obj = data as { data?: unknown; contacts?: unknown; conversations?: unknown };
  if (!Array.isArray(data) && !obj.data && !obj.contacts && !obj.conversations) {
    console.warn('[contacts] GET /contacts unknown shape:', data);
  }
  return rawList.map(mapContact);
}

export async function updateContactCustomName(userId: string, customName: string): Promise<void> {
  if (DEV_MODE) {
    await delay(200);
    const contact = MOCK_CONTACTS.find((c) => c.userId === userId);
    if (contact) {
      contact.customName = customName;
      updateConversationName(userId, customName);
    }
    return;
  }
  await api.patch(`/contacts/${userId}`, { customName });
}
