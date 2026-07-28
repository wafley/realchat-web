import type { Contact, User } from '@/types';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { DEV_USER_ID, MOCK_USERS } from '@/mocks/users';
import { MOCK_CONTACTS } from '@/mocks/contacts';
import { delay } from '@/mocks/utils';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export async function searchPeople(query: string): Promise<User[]> {
  if (DEV_MODE) {
    await delay(300);
    const q = query.toLowerCase();
    return MOCK_USERS.filter(
      (u) =>
        u.id !== DEV_USER_ID &&
        !MOCK_CONTACTS.some((c) => c.userId === u.id) &&
        (u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)),
    );
  }
  try {
    const { data } = await api.get<User[]>('/users/search', { params: { q: query } });
    const currentUserId = useAuthStore.getState().user?.id;
    return data.filter((u) => u.id !== currentUserId);
  } catch {
    throw new Error('Failed to search users');
  }
}

export async function findUser(query: string): Promise<User | null> {
  if (DEV_MODE) {
    await delay(100);
    const q = query.toLowerCase().replace(/^@/, '');
    const user = MOCK_USERS.find(
      (u) => u.id !== DEV_USER_ID && (u.username.toLowerCase() === q || u.fullName.toLowerCase() === q),
    );
    return user ?? null;
  }
  try {
    const { data } = await api.get<User>('/users/find', { params: { q: query } });
    return data;
  } catch {
    return null;
  }
}

export async function addContact(userId: string, customName?: string): Promise<Contact> {
  if (DEV_MODE) {
    await delay(300);
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    if (MOCK_CONTACTS.some((c) => c.userId === userId)) throw new Error('Already in contacts');
    const contact: Contact = { userId, user, customName, addedAt: new Date() };
    MOCK_CONTACTS.push(contact);
    return contact;
  }
  const { data } = await api.post<Contact>('/me/contacts', { userId, customName });
  return data;
}

export async function removeContact(userId: string): Promise<void> {
  if (DEV_MODE) {
    await delay(200);
    const idx = MOCK_CONTACTS.findIndex((c) => c.userId === userId);
    if (idx !== -1) MOCK_CONTACTS.splice(idx, 1);
    return;
  }
  await api.delete(`/me/contacts/${userId}`);
}

export async function getContacts(): Promise<Contact[]> {
  if (DEV_MODE) {
    await delay(200);
    return [...MOCK_CONTACTS];
  }
  const { data } = await api.get<Contact[]>('/me/contacts');
  return data;
}

export async function updateContactCustomName(userId: string, customName: string): Promise<void> {
  if (DEV_MODE) {
    await delay(200);
    const contact = MOCK_CONTACTS.find((c) => c.userId === userId);
    if (contact) contact.customName = customName;
    return;
  }
  await api.patch(`/me/contacts/${userId}`, { customName });
}
