# Backend Spec — Contact System (1-way, like WhatsApp)

## 1. Database

### Table — `contacts`

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | UUID | User yang punya kontak |
| `contact_id` | UUID | User yang ditambahkan sebagai kontak |
| `custom_name` | VARCHAR(100) | Nama tampilan khusus (optional) |
| `created_at` | Timestamp | |

**Primary key:** `(user_id, contact_id)`

**Index:** `contact_id`, `user_id`

> Hapus tabel `follows`, `friends`, `friend_requests` — ganti dengan `contacts`.

---

## 2. API Endpoints

### 2.1 Add Contact
```
POST /me/contacts/:userId
```
**Body:** `{ customName?: string }`

**Auth:** Bearer token

**Response:** `200 OK` (idempotent)

**Notes:** 1-way, no approval needed. Kalo udah di-contact, balikin `200 OK`.

---

### 2.2 Remove Contact
```
DELETE /me/contacts/:userId
```
**Auth:** Bearer token

**Response:** `200 OK` (idempotent)

---

### 2.3 Get My Contacts
```
GET /me/contacts
```
**Auth:** Bearer token

**Response:**
```json
[
  {
    "userId": "uuid",
    "user": { ... },
    "customName": "Nama Panggilan",
    "addedAt": "2026-07-27T..."
  }
]
```

**Notes:** Default sort by customName → fullName. Query param: `?sort=recent|name`.

---

### 2.4 Update Contact Custom Name
```
PATCH /me/contacts/:userId
```
**Body:** `{ customName: string }`

**Auth:** Bearer token

**Response:** `200 OK`

---

### 2.5 Search People (not in contacts)
```
GET /users/search?q={query}
```
**Auth:** Bearer token

**Response:** `User[]`

**Notes:** Nyari user yang **belom** di-contact. Filter out current user.

---

## 3. Frontend Behavior

### 3.1 Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/profile` | `ProfilePage` | Own profile page |
| `/profile/:userId` | `UserProfile` | Other user's profile |

> Routes `/friends/*`, `/profile/following`, `/profile/followers`, `/profile/:userId/following`, `/profile/:userId/followers` — **dihapus**.

### 3.2 Components

#### ContactPopover
- **Trigger:** [+] button di ChatList header
- **Popover (Modal):**
  - "Add Contact" → buka AddContactModal
  - "Create New Group" → navigate ke `/groups/create`
  - **Divider**
  - **Contact list** — avatar + name (customName || fullName), tap → DM

#### AddContactModal
- Search input dengan debounce 300ms
- Search via `GET /users/search?q=...` (cuma user yang belum di-contact)
- Tap user → `addContact(userId)` → langsung close modal + navigate ke DM

#### UserProfile (other user's profile)
- **Add Contact button** — filled accent, muncul kalo belum di-contact
- **Remove Contact button** — border style, hover red, muncul kalo udah di-contact
- **Send Message button** — selalu muncul (1-way chat)
- **Block User button** — selalu muncul
- **Follower/following count — dihapus** (kontak bersifat private)

#### Own Profile
- **Follower/following count — dihapus**

---

## 4. Query Invalidation Scheme

| Query Key | Fungsi | Di-invalidate saat |
|-----------|--------|-------------------|
| `['contacts']` | Contact list | Add / Remove Contact |

---

## 5. Notes

- Contacts are **private** (tidak ada public contact list).
- Tidak ada "mutual contact" atau "contact request".
- 1-way DM tetap berlaku — kontak hanya memudahkan akses, bukan syarat chat.
- Tabel `follows` and related endpoints **dihapus total**.
