import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, UserPlus, MessageSquare, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrivacyStore } from '@/store/privacyStore';
import { useQuery } from '@tanstack/react-query';
import { getBlockedUsers } from '@/services/chat';

const LAST_SEEN_OPTIONS = [
  { value: 'everyone' as const, label: 'Everyone' },
  { value: 'contacts' as const, label: 'My Contacts' },
  { value: 'nobody' as const, label: 'Nobody' },
];

const GROUP_ADD_OPTIONS = [
  { value: 'everyone' as const, label: 'Everyone' },
  { value: 'contacts' as const, label: 'My Contacts' },
  { value: 'nobody' as const, label: 'Nobody' },
];

export default function SettingsPrivacy() {
  const navigate = useNavigate();
  const { lastSeen, addToGroups, readReceipts, setLastSeen, setAddToGroups, setReadReceipts } = usePrivacyStore();

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: getBlockedUsers,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:hidden">
        <button onClick={() => navigate(-1)} className="text-foreground transition-colors hover:text-accent">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-foreground">Privacy</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="hidden text-muted-foreground transition-colors hover:text-accent md:flex">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground">Privacy</h2>
              <p className="text-sm text-muted-foreground">Control your privacy settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <section className="overflow-hidden rounded-xl bg-card">
              <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
                <Eye size={18} className="text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Who can see my personal info</span>
              </div>
              <div className="px-4 py-3">
                <p className="mb-2 text-sm text-foreground">Last Seen & Online</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  {lastSeen === 'nobody'
                    ? 'Your last seen is hidden from everyone. You also won\'t see others\' last seen.'
                    : lastSeen === 'contacts'
                      ? 'Only your contacts can see your last seen.'
                      : 'Everyone can see when you were last online.'}
                </p>
                <div className="flex gap-1.5">
                  {LAST_SEEN_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLastSeen(opt.value)}
                      className={cn(
                        'flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                        lastSeen === opt.value
                          ? 'bg-accent text-accent-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl bg-card">
              <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
                <UserPlus size={18} className="text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Who can contact me</span>
              </div>
              <div className="px-4 py-3">
                <p className="mb-2 text-sm text-foreground">Who can add me to groups</p>
                <div className="flex gap-1.5">
                  {GROUP_ADD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAddToGroups(opt.value)}
                      className={cn(
                        'flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                        addToGroups === opt.value
                          ? 'bg-accent text-accent-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl bg-card">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} className="text-muted-foreground" />
                  <div>
                    <span className="text-sm text-foreground">Read receipts</span>
                    <p className="text-xs text-muted-foreground">
                      {readReceipts
                        ? 'Others can see when you read their messages'
                        : 'You won\'t send read receipts, but you also can\'t see others\' read status'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReadReceipts(!readReceipts)}
                  className={cn(
                    'relative h-6 w-10 shrink-0 rounded-full transition-colors',
                    readReceipts ? 'bg-accent' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                      readReceipts && 'translate-x-4',
                    )}
                  />
                </button>
              </div>
            </section>

            <Link
              to="/settings/privacy/blocked"
              className="flex items-center gap-3 rounded-xl bg-card px-4 py-3.5 transition-colors hover:bg-accent/5"
            >
              <Ban size={18} className="text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">Blocked users</p>
              </div>
              <span className="text-xs text-muted-foreground">{blockedUsers.length}</span>
              <ArrowLeft size={16} className="rotate-180 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
