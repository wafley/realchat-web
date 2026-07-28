import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, User, Users, MessageSquareText, Loader2, ArrowLeft, Check } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getContacts, addContact, searchPeople, findUser } from '@/services/contacts';
import { findOrCreateConversation } from '@/services/chat';
import type { User as UserType } from '@/types';

interface ContactPopoverProps {
  open: boolean;
  onClose: () => void;
}

type View = 'main' | 'new-contact';

export default function ContactPopover({ open, onClose }: ContactPopoverProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>('main');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserType[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New Contact form
  const [newUsername, setNewUsername] = useState('');
  const [newCustomName, setNewCustomName] = useState('');
  const [newContactLoading, setNewContactLoading] = useState(false);
  const [newContactError, setNewContactError] = useState<string | null>(null);

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
    enabled: open,
  });

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const users = await searchPeople(value.trim());
        setResults(users);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleStartDM = async (userId: string) => {
    try {
      const convId = await findOrCreateConversation(userId);
      onClose();
      navigate(`/dm/${convId}`);
    } catch {
      // silently fail
    }
  };

  const handleSelectUser = async (user: UserType) => {
    const isContact = contacts?.some((c) => c.userId === user.id);
    if (!isContact) {
      try {
        await addContact(user.id);
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
      } catch {
        // silently fail
      }
    }
    handleStartDM(user.id);
  };

  const handleNewContact = async () => {
    if (!newUsername.trim()) return;
    setNewContactLoading(true);
    setNewContactError(null);
    try {
      const user = await findUser(newUsername.trim());
      if (!user) {
        setNewContactError('User not found');
        return;
      }
      await addContact(user.id, newCustomName.trim() || undefined);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      handleStartDM(user.id);
    } catch {
      setNewContactError('Failed to add contact');
    } finally {
      setNewContactLoading(false);
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setSearching(false);
    setView('main');
    setNewUsername('');
    setNewCustomName('');
    setNewContactError(null);
    onClose();
  };

  const goBack = () => {
    setView('main');
    setNewUsername('');
    setNewCustomName('');
    setNewContactError(null);
  };

  return (
    <Modal open={open} onClose={handleClose} title={view === 'new-contact' ? 'New Contact' : 'New Chat'}>
      {view === 'new-contact' ? (
        <div className="space-y-4">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">@username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter @username"
              autoFocus
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Custom name <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <input
              type="text"
              value={newCustomName}
              onChange={(e) => setNewCustomName(e.target.value)}
              placeholder="e.g. Si Gacor"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {newContactError && (
            <p className="text-xs text-destructive">{newContactError}</p>
          )}

          <button
            onClick={handleNewContact}
            disabled={!newUsername.trim() || newContactLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
          >
            {newContactLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {newContactLoading ? 'Adding...' : 'Save'}
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="relative mb-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              aria-label="Search"
              placeholder="Search or type @username..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <button
            onClick={() => setView('new-contact')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/10 lg:gap-3.5 lg:px-4 lg:py-3 lg:text-base"
          >
            <UserPlus size={18} className="text-muted-foreground lg:size-5" />
            New Contact
          </button>

          <button
            onClick={() => { onClose(); navigate('/groups/create'); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/10 lg:gap-3.5 lg:px-4 lg:py-3 lg:text-base"
          >
            <MessageSquareText size={18} className="text-muted-foreground lg:size-5" />
            Create New Group
          </button>

          <div className="my-2 border-t border-border" />

          {searching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : query.trim() && results.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No users found</p>
          ) : query.trim() ? (
            <div className="max-h-48 space-y-0.5 overflow-y-auto">
              {results.map((user) => {
                const isContact = contacts?.some((c) => c.userId === user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/10 lg:gap-3.5 lg:px-4 lg:py-2.5 lg:text-base"
                  >
                    <Avatar className="h-9 w-9">
                      {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                      <AvatarFallback>
                        <User size={14} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="truncate font-medium">{user.fullName}</div>
                      <div className="truncate text-xs text-muted-foreground">@{user.username}</div>
                    </div>
                    {isContact && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">contact</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : contacts && contacts.length > 0 ? (
            <>
              <p className="px-1 pb-1 text-xs font-semibold uppercase text-muted-foreground lg:px-1.5 lg:text-sm">
                Contacts
              </p>
              <div className="max-h-48 space-y-0.5 overflow-y-auto">
                {contacts.map((contact) => {
                  const displayName = contact.customName || contact.user.fullName;
                  return (
                    <button
                      key={contact.userId}
                      onClick={() => handleSelectUser(contact.user)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/10 lg:gap-3.5 lg:px-4 lg:py-2.5 lg:text-base"
                    >
                      <Avatar className="h-8 w-8 lg:h-9 lg:w-9">
                        {contact.user.avatarUrl && <AvatarImage src={contact.user.avatarUrl} />}
                        <AvatarFallback className="text-xs">
                          <User size={14} />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate font-medium">{displayName}</div>
                        {contact.customName && (
                          <div className="truncate text-xs text-muted-foreground">
                            @{contact.user.username}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
