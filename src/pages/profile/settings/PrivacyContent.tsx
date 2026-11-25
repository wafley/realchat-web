import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBlockedUsers } from '@/services/chat';
import { usePrivacyStore } from '@/store/privacyStore';
import CustomSelect from '@/components/ui/custom-select';

export default function PrivacyContent() {
  const navigate = useNavigate();
  const { lastSeen, addToGroups, readReceipts, setLastSeen, setAddToGroups, setReadReceipts } = usePrivacyStore();
  const { data: blockedUsers = [] } = useQuery({ queryKey: ['blocked-users'], queryFn: getBlockedUsers });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground">Last Seen</span>
        <CustomSelect
          value={lastSeen}
          onChange={(v) => setLastSeen(v as any)}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'contacts', label: 'My Contacts' },
            { value: 'nobody', label: 'Nobody' },
          ]}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground">Who can add me to groups</span>
        <CustomSelect
          value={addToGroups}
          onChange={(v) => setAddToGroups(v as any)}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'contacts', label: 'My Contacts' },
            { value: 'nobody', label: 'Nobody' },
          ]}
        />
      </div>
      <label className="flex items-center justify-between">
        <span className="text-sm text-foreground">Read Receipts</span>
        <button onClick={() => setReadReceipts(!readReceipts)} className={cn('relative h-5 w-9 rounded-full transition-colors', readReceipts ? 'bg-accent' : 'bg-muted-foreground/30')}>
          <span className={cn('absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform', readReceipts && 'translate-x-4')} />
        </button>
      </label>
      <button onClick={() => navigate('/settings/privacy/blocked')} className="flex w-full items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-left transition-colors hover:bg-accent/5">
        <span className="text-sm text-foreground">Blocked Users</span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">{blockedUsers.length}<ExternalLink size={12} /></div>
      </button>
    </div>
  );
}
