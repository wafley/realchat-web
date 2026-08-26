import UserProfile from '@/pages/profile/UserProfile';

interface UserInfoPanelProps {
  userId: string;
  onClose: () => void;
  onClearChat: () => void;
}

export default function UserInfoPanel({ userId, onClose, onClearChat }: UserInfoPanelProps) {
  return <UserProfile userIdOverride={userId} onPanelClose={onClose} onClearChat={onClearChat} />;
}
