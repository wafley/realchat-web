import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Loader2, AlertCircle, Users, ArrowLeft, UserMinus, Crown, Shield, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import { getGroup, leaveGroup, removeGroupMember, updateMemberRole, updateGroup, deleteGroup } from '@/services/chat';
import { leaveRoom } from '@/services/socket.service';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/errors';

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: group, isPending, isError } = useQuery({
    queryKey: ['group', id],
    queryFn: () => getGroup(id!),
    enabled: !!id,
  });

  const editMutation = useMutation({
    mutationFn: () => updateGroup(id!, { name: editName, description: editDesc }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setEditOpen(false);
      toast.success('Group updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGroup(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Group deleted');
      navigate('/');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <AlertCircle size={32} className="text-destructive/60" />
        <p className="text-sm text-muted-foreground">Failed to load group</p>
        <button onClick={() => navigate('/')} className="text-sm text-accent hover:underline">
          Back to home
        </button>
      </div>
    );
  }

  const myMembership = group.members?.find((m) => m.userId === currentUser?.id);
  const isAdmin = myMembership?.role === 'admin';
  const isCreator = group.creatorId === currentUser?.id;

  const handleLeave = async () => {
    if (!id) return;
    try {
      await leaveGroup(id);
      leaveRoom(id);
      toast.success('Left group');
      navigate('/');
    } catch {
      toast.error('Failed to leave group');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    try {
      await removeGroupMember(id, userId);
      toast.success('Member removed');
      setShowActions(null);
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'member') => {
    if (!id) return;
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    try {
      await updateMemberRole(id, userId, newRole);
      toast.success(`Member role updated to ${newRole}`);
      setShowActions(null);
    } catch {
      toast.error('Failed to update role');
    }
  };

  const openEdit = () => {
    setEditName(group?.name ?? '');
    setEditDesc(group?.description ?? '');
    setEditOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5">
      <button
        onClick={() => navigate('/')}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mb-6 flex items-center gap-4">
        <Avatar className="h-16 w-16 shrink-0">
          {group.avatarUrl && <AvatarImage src={group.avatarUrl} alt={group.name} />}
          <AvatarFallback className="text-xl font-bold"><Users size={24} /></AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-foreground">{group.name}</h1>
          {group.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{group.description}</p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              <Users size={10} className="mr-1" />
              {group.members?.length ?? 0} members
            </Badge>
            {group.isPrivate && (
              <Badge variant="warning" className="text-[10px]">Private</Badge>
            )}
          </div>
        </div>
        {(isAdmin || isCreator) && (
          <div className="flex shrink-0 gap-1">
            <button
              onClick={openEdit}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
            >
              <Pencil size={16} />
            </button>
            {isCreator && (
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Members</h2>
        {isAdmin && (
          <button
            onClick={() => navigate(`/groups/${id}/add-member`)}
            className="text-xs text-accent hover:underline"
          >
            + Add Member
          </button>
        )}
      </div>

      <div className="space-y-1">
        {group.members?.map((member) => {
          const isMe = member.userId === currentUser?.id;
          const memberUser = member.user;
          return (
            <div
              key={member.id}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/5"
            >
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9">
                  {memberUser?.avatarUrl && <AvatarImage src={memberUser.avatarUrl} />}
                  <AvatarFallback className="text-xs font-bold">
                    {(memberUser?.fullName || memberUser?.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {memberUser?.status === 'online' && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-foreground">
                    {memberUser?.fullName ?? member.userId}
                  </p>
                  {isMe && <span className="text-xs text-muted-foreground">(you)</span>}
                </div>
                {memberUser?.username && <p className="text-xs text-muted-foreground">@{memberUser.username}</p>}
              </div>
              <div className="flex items-center gap-2">
                {member.role === 'admin' && (
                  <Badge variant="default" className="gap-1 text-[10px]">
                    <Crown size={10} />
                    Admin
                  </Badge>
                )}
                {!isMe && (isAdmin || isCreator) && (
                  <div className="relative">
                    <button
                      onClick={() => setShowActions(showActions === member.id ? null : member.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-accent/10 group-hover:opacity-100"
                    >
                      <MoreVertical size={14} />
                    </button>
                    {showActions === member.id && (
                      <div className="absolute right-0 top-8 z-10 w-40 rounded-xl border border-border bg-background py-1 shadow-lg">
                        {(isAdmin || isCreator) && member.userId !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleRole(member.userId, member.role)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent/10"
                          >
                            <Shield size={14} />
                            {member.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                          </button>
                        )}
                        {(isAdmin || isCreator) && member.userId !== currentUser?.id && (
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                          >
                            <UserMinus size={14} />
                            Remove Member
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isCreator && (
        <div className="mt-6 border-t border-border pt-4">
          <button
            onClick={handleLeave}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <UserMinus size={16} />
            Leave Group
          </button>
        </div>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Group">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Group Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => editMutation.mutate()}
            disabled={!editName.trim() || editMutation.isPending}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
          >
            {editMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Group">
        <p className="mb-4 text-sm text-muted-foreground">
          Are you sure you want to delete this group? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setDeleteOpen(false)}
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
          >
            {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
