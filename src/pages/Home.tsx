import { MessageSquareText } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <MessageSquareText
          size={48}
          className="mx-auto text-muted-foreground/40"
        />
        <h2 className="mt-4 text-lg font-medium text-foreground">
          Select a chat
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a conversation from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
}
