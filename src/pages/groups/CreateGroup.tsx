import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, X, Loader2, Camera } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { createGroup, searchUsers } from '@/services/chat';
import type { User } from '@/types';

export default function CreateGroup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchMutation = useMutation({
    mutationFn: (q: string) => searchUsers(q),
    onSuccess: (data) => setSearchResults(data.filter((u) => u.id !== 'dev-user-1')),
  });

  const createMutation = useMutation({
    mutationFn: () => createGroup(name, description, selectedIds, isPrivate),
    onSuccess: (group) => navigate(`/groups/${group.id}`),
  });

  const handleSearch = (q: string) => {
    setUserSearch(q);
    if (q.trim()) searchMutation.mutate(q.trim());
    else setSearchResults([]);
  };

  const toggleUser = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3 md:px-6">
        <button
          onClick={() => navigate('/groups')}
          className="-ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-foreground lg:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-foreground">Create Group</h1>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-accent/5 transition-colors hover:border-accent/50 hover:bg-accent/10"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
              ) : (
                <Camera size={20} className="text-muted-foreground group-hover:text-accent" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Group Photo</p>
              <p className="text-xs text-muted-foreground">Optional — click to upload</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Group Name</label>
            <input
              type="text"
              placeholder="Enter group name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
            <textarea
              placeholder="Describe what this group is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Private Group</p>
              <p className="text-xs text-muted-foreground">Only invited members can join</p>
            </div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative h-6 w-11 rounded-full transition-colors ${isPrivate ? 'bg-accent' : 'bg-muted'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isPrivate ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Add Members</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {searchMutation.isPending && (
              <div className="mt-2 flex justify-center py-3">
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1 rounded-xl border border-border p-2">
                {searchResults.map((u) => {
                  const isSelected = selectedIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                        isSelected ? 'bg-accent/10' : 'hover:bg-accent/5'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{u.fullName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{u.fullName}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                          <X size={10} className="text-accent-foreground" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedIds.map((id) => {
                  const u = searchResults.find((r) => r.id === id);
                  if (!u) return null;
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent"
                    >
                      {u.fullName}
                      <button onClick={() => toggleUser(id)} className="ml-0.5 hover:text-foreground">
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
