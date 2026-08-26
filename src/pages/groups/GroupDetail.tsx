import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import GroupInfoPanel from '@/components/chat/GroupInfoPanel';
import {
  getGroup,
  leaveGroup,
  removeGroupMember,
  updateMemberRole,
  updateGroup,
  deleteGroup,
  addGroupMember,
  searchUsers,
} from '@/services/chat';
import { leaveRoom } from '@/services/socket.service';
import { useAuthStore } from '@/store/authStore';

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const { data: group, isPending, isError } = useQuery({
    queryKey: ['group', id],
    queryFn: () => getGroup(id!),
    enabled: !!id,
  });

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12">
        <AlertCircle size={32} className="text-destructive/60" />
        <p className="text-sm text-muted-foreground">Failed to load group</p>
        <button onClick={() => navigate('/groups')} className="text-sm text-accent hover:underline font-medium">
          Back to groups
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 h-full overflow-hidden p-2 md:p-4">
      <div className="h-full rounded-2xl border border-border shadow-sm overflow-hidden">
        <GroupInfoPanel
          group={group}
          currentUserId={currentUser?.id}
          onClose={() => navigate('/groups')}
          onUpdateGroup={async (data) => {
            if (id) {
              await updateGroup(id, data);
              queryClient.invalidateQueries({ queryKey: ['groups'] });
            }
          }}
          onAddMember={async (userId) => {
            if (id) {
              await addGroupMember(id, userId);
            }
          }}
          onRemoveMember={async (userId) => {
            if (id) {
              await removeGroupMember(id, userId);
            }
          }}
          onLeaveGroup={async () => {
            if (id) {
              await leaveGroup(id);
              leaveRoom(id);
              queryClient.invalidateQueries({ queryKey: ['groups'] });
              navigate('/groups');
            }
          }}
          onDeleteGroup={async () => {
            if (id) {
              await deleteGroup(id);
              queryClient.invalidateQueries({ queryKey: ['groups'] });
              navigate('/groups');
            }
          }}
          onUpdateMemberRole={async (userId, role) => {
            if (id) {
              await updateMemberRole(id, userId, role);
            }
          }}
          searchUsers={searchUsers}
        />
      </div>
    </div>
  );
}
