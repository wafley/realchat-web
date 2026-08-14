import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, MessageSquareText, Search, Loader2, X, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getContacts, addContact, searchContacts } from '@/services/contacts';
import { parseAuthError } from '@/services/auth';
import { findOrCreateConversation } from '@/services/chat';
import type { User as UserType } from '@/types';

interface ContactPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export default function ContactPopover({ anchorEl, onClose }: ContactPopoverProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const drawerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserType[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New Contact form (inline)
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newCustomName, setNewCustomName] = useState('');
  const [newContactLoading, setNewContactLoading] = useState(false);
  const [newContactError, setNewContactError] = useState<string | null>(null);

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
    enabled: !!anchorEl,
  });

  // Reset state on open
  useEffect(() => {
    if (anchorEl) {
      setQuery('');
      setResults([]);
      setSearching(false);
      setShowNewContactForm(false);
      setNewUsername('');
      setNewCustomName('');
      setNewContactError(null);
    }
  }, [anchorEl]);

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
        const users = await searchContacts(value.trim());
        setResults(users);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleStartDM = async (userId: string, displayName?: string) => {
    try {
      const convId = await findOrCreateConversation(userId);
      onClose();
      navigate(`/dm/${convId}`, { state: { name: displayName } });
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  const handleSelectUser = (user: UserType) => {
    const contact = contacts?.find((c) => c.userId === user.id);
    handleStartDM(user.id, contact?.customName || user.fullName);
  };

  const handleNewContact = async () => {
    if (!newUsername.trim()) return;
    setNewContactLoading(true);
    setNewContactError(null);
    try {
      const contact = await addContact(newUsername.trim(), newCustomName.trim() || undefined);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowNewContactForm(false);
      setNewUsername('');
      setNewCustomName('');
      toast.success('Contact added!');
      await handleStartDM(contact.userId, contact.customName || contact.user.fullName);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err) {
      setNewContactError(parseAuthError(err));
    } finally {
      setNewContactLoading(false);
    }
  };

  if (!anchorEl) return null;

  const showContacts = !query.trim() && contacts && contacts.length > 0;
  const showResults = query.trim();
  const showActions = !query.trim() && !showNewContactForm;
  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <div
        ref={drawerRef}
        className="fixed left-0 top-0 z-[101] flex h-full w-full flex-col rounded-r-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-left-2 duration-200 lg:left-20 lg:w-[30rem] pt-[env(safe-area-inset-top,0px)] lg:pt-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          {showNewContactForm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewContactForm(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-sm font-bold text-foreground">New Contact</h2>
            </div>
          ) : (
            <h2 className="text-sm font-bold text-foreground">New Conversation</h2>
          )}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {showNewContactForm ? (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
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
                {newContactLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                {newContactLoading ? 'Adding...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="p-3">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  aria-label="Search"
                  placeholder="Search contacts..."
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {showActions && (
                <div className="border-t border-border px-1 pb-1">
                  <button
                    onClick={() => setShowNewContactForm(true)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
                  >
                    <UserPlus size={18} className="text-muted-foreground" />
                    New Contact
                  </button>

                  <button
                    onClick={() => { onClose(); navigate('/groups/create'); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
                  >
                    <MessageSquareText size={18} className="text-muted-foreground" />
                    Create New Group
                  </button>
                </div>
              )}

              {searching ? (
                <div className="flex items-center justify-center border-t border-border py-6">
                  <Loader2 size={18} className="animate-spin text-muted-foreground" />
                </div>
              ) : showResults ? (
                <div className="border-t border-border px-1 pb-1">
                  {results.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">No users found</p>
                  ) : (
                    <div className="space-y-0.5">
                      {results.map((user) => {
                        const isContact = contacts?.some((c) => c.userId === user.id);
                        return (
                          <button
                            key={user.id}
                            onClick={() => handleSelectUser(user)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
                          >
                            <Avatar className="h-8 w-8">
                              {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                              <AvatarFallback className="text-xs font-semibold">
                                {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 text-left">
                              <div className="truncate text-sm font-medium">{user.fullName}</div>
                              <div className="truncate text-xs text-muted-foreground">@{user.username}</div>
                            </div>
                            {isContact && (
                              <span className="shrink-0 text-[10px] text-muted-foreground">contact</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : showContacts ? (
                <div className="border-t border-border px-1 pb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase text-muted-foreground">
                    Contacts
                  </p>
                  <div className="space-y-0.5">
                    {contacts.map((contact) => {
                      const displayName = contact.customName || contact.user.fullName;
                      return (
                        <button
                          key={contact.userId}
                          onClick={() => handleSelectUser(contact.user)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
                        >
                          <Avatar className="h-8 w-8">
                            {contact.user.avatarUrl && <AvatarImage src={contact.user.avatarUrl} />}
                            <AvatarFallback className="text-xs font-semibold">
                              {(displayName || contact.user.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="truncate text-sm font-medium">{displayName}</div>
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
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
