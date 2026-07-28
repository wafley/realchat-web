import type { User } from '@/types';

export const DEV_USER_ID = 'dev-user-1';

const EXISTING_USERS: User[] = [
  { id: 'aang', username: 'aang_gacor', fullName: 'Aang Gacor', email: 'aang@example.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-07-01') },
  { id: 'bambang', username: 'bambang', fullName: 'Bambang', email: 'bambang@example.com', status: 'online', lastSeen: new Date(Date.now() - 60000), createdAt: new Date('2026-07-01') },
  { id: 'cici', username: 'cici', fullName: 'Cici', email: 'cici@example.com', status: 'online', lastSeen: new Date(Date.now() - 300000), createdAt: new Date('2026-07-01') },
  { id: 'dewi', username: 'dewi', fullName: 'Dewi', email: 'dewi@example.com', status: 'offline', lastSeen: new Date(Date.now() - 3600000), createdAt: new Date('2026-07-01') },
  { id: 'eko', username: 'eko', fullName: 'Eko', email: 'eko@example.com', status: 'offline', lastSeen: new Date(Date.now() - 86400000), createdAt: new Date('2026-07-01') },
  { id: 'frank', username: 'franko', fullName: 'Frank Ocean', email: 'frank@example.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-07-01') },
  { id: 'grace', username: 'graceh', fullName: 'Grace Hopper', email: 'grace@example.com', status: 'offline', lastSeen: new Date(Date.now() - 7200000), createdAt: new Date('2026-07-01') },
  { id: DEV_USER_ID, username: 'Dev-Account', fullName: 'Alxyzz', email: 'mafzq6750@gmail.com', status: 'online', lastSeen: new Date(), createdAt: new Date('2026-01-01') },
];

const GENSHIN_CHARACTERS: { id: string; username: string; fullName: string; status: 'online' | 'offline' | 'away'; hoursAgo?: number }[] = [
  { id: 'zhongli', username: 'hydro_archon', fullName: 'Furina', status: 'online' },
  { id: 'xiao', username: 'wangsheng', fullName: 'Hu Tao', status: 'online' },
  { id: 'ganyu', username: 'snow_grace', fullName: 'Ganyu', status: 'offline', hoursAgo: 3 },
  { id: 'hutao', username: 'narukami', fullName: 'Raiden Shogun', status: 'offline', hoursAgo: 12 },
  { id: 'raiden', username: 'lesser_kusanali', fullName: 'Nahida', status: 'online' },
  { id: 'nahida', username: 'zubayr', fullName: 'Nilou', status: 'online' },
  { id: 'furina', username: 'naganohara', fullName: 'Yoimiya', status: 'online' },
  { id: 'neuvillette', username: 'guuji', fullName: 'Yae Miko', status: 'away' },
  { id: 'alhaitham', username: 'cloud_retainer', fullName: 'Shenhe', status: 'offline', hoursAgo: 8 },
  { id: 'kazuha', username: 'keya', fullName: 'Yelan', status: 'online' },
  { id: 'bennett', username: 'watatsumi', fullName: 'Kokomi', status: 'offline', hoursAgo: 6 },
  { id: 'fischl', username: 'spina_rosa', fullName: 'Navia', status: 'online' },
  { id: 'mona', username: 'duelist', fullName: 'Clorinde', status: 'online' },
  { id: 'qiqi', username: 'knave', fullName: 'Arlecchino', status: 'online' },
  { id: 'keqing', username: 'spindrift', fullName: 'Eula', status: 'offline', hoursAgo: 4 },
  { id: 'shenhe', username: 'mage', fullName: 'Frieren', status: 'away' },
  { id: 'yelan', username: 'apprentice', fullName: 'Fern', status: 'online' },
  { id: 'kokomi', username: 'miku', fullName: 'Hatsune Miku', status: 'online' },
  { id: 'arlecchino', username: 'rin', fullName: 'Kagamine Rin', status: 'online' },
  { id: 'childe', username: 'luka', fullName: 'Megurine Luka', status: 'offline', hoursAgo: 5 },
  { id: 'wanderer', username: 'yorha', fullName: '2B', status: 'away' },
  { id: 'baizhu', username: 'prototype', fullName: 'A2', status: 'offline', hoursAgo: 2 },
  { id: 'cyno', username: 'spy', fullName: 'Ada Wong', status: 'online' },
  { id: 'nilou', username: 'stars', fullName: 'Jill Valentine', status: 'online' },
  { id: 'dehya', username: 'bike', fullName: 'Claire Redfield', status: 'offline', hoursAgo: 10 },
  { id: 'tighnari', username: 'seventh_heaven', fullName: 'Tifa Lockhart', status: 'away' },
  { id: 'albedo', username: 'flower_girl', fullName: 'Aerith Gainsborough', status: 'online' },
  { id: 'eula', username: 'king_of_knights', fullName: 'Saber', status: 'online' },
  { id: 'yoimiya', username: 'gem_mage', fullName: 'Rin Tohsaka', status: 'online' },
  { id: 'yae_miko', username: 'maid', fullName: 'Rem', status: 'offline', hoursAgo: 7 },
  { id: 'heizou', username: 'half_elf', fullName: 'Emilia', status: 'away' },
  { id: 'kuki_shinobu', username: 'flash', fullName: 'Asuna', status: 'offline', hoursAgo: 7 },
  { id: 'layla', username: 'thorn_princess', fullName: 'Yor Forger', status: 'online' },
  { id: 'navia', username: 'waku_waku', fullName: 'Anya Forger', status: 'online' },
  { id: 'clorinde', username: 'roshidere', fullName: 'Alisa Kujou', status: 'online' },
  { id: 'wriothesley', username: 'yuki', fullName: 'Mariya Kujou', status: 'offline', hoursAgo: 14 },
  { id: 'xilonen', username: 'control', fullName: 'Makima', status: 'away' },
  { id: 'mualani', username: 'blood', fullName: 'Power', status: 'online' },
  { id: 'kinich', username: 'car', fullName: 'Kobeni', status: 'online' },
  { id: 'kachina', username: 'president', fullName: 'Kaguya Shinomiya', status: 'online' },
  { id: 'amber', username: 'chika', fullName: 'Chika Fujiwara', status: 'online' },
  { id: 'noelle', username: 'snake_princess', fullName: 'Boa Hancock', status: 'online' },
];

const newUsers: User[] = GENSHIN_CHARACTERS.map((c) => ({
  id: c.id,
  username: c.username,
  fullName: c.fullName,
  email: `${c.id}@example.com`,
  status: c.status,
  lastSeen: c.status === 'offline' ? new Date(Date.now() - (c.hoursAgo ?? 24) * 3600000) : (c.status === 'away' ? new Date(Date.now() - 900000) : new Date()),
  createdAt: new Date('2026-07-01'),
}));

export const MOCK_USERS: User[] = [...EXISTING_USERS, ...newUsers];