import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactionPicker from '@/components/chat/ReactionPicker';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatSearchBar from '@/components/chat/ChatSearchBar';
import PinnedBanner from '@/components/chat/PinnedBanner';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import ChatOverlays from '@/components/chat/ChatOverlays';
import { useChatState } from '@/hooks/chat/useChatState';
import { useChatMutations } from '@/hooks/chat/useChatMutations';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { joinRoom, joinAllConversationRooms, setCurrentChat, emitSeenForConversation } from '@/services/socket.service';

export default function ChatRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = useChatState();
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const handledHighlightIdRef = useRef<string | null>(null);

  useEffect(() => {
    handledHighlightIdRef.current = null;
  }, [state.chatId]);

  useEffect(() => {
    const targetId = location.state?.highlightMessageId;
    if (!targetId || handledHighlightIdRef.current === targetId) return;
    handledHighlightIdRef.current = targetId;
    setHighlightedMsgId(targetId);

    let attempts = 0;
    const retry = setInterval(() => {
      attempts += 1;
      const el = document.getElementById(`msg-${targetId}`);
      if (el) {
        clearInterval(retry);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (attempts >= 60) {
        clearInterval(retry);
      }
    }, 150);

    const fadeTimer = setTimeout(() => {
      setHighlightedMsgId(null);
    }, 3000);

    return () => {
      clearInterval(retry);
      clearTimeout(fadeTimer);
    };
  }, [location.state?.highlightMessageId]);

  const mutations = useChatMutations({
    chatId: state.chatId,
    isDM: state.isDM,
    setDeleteTarget: state.setDeleteTarget,
    setDeleteLoading: state.setDeleteLoading,
    setForwardTarget: state.setForwardTarget,
    setForwardSearch: state.setForwardSearch,
    setEditingMsg: state.setEditingMsg,
    setInput: state.setInput,
    setPinnedMessages: state.setPinnedMessages,
    setGroupInfoOpen: state.setGroupInfoOpen,
  });

  const actions = useChatActions({
    chatId: state.chatId,
    input: state.input,
    messages: state.messages,
    showSearch: state.showSearch,
    showEmojiPicker: state.showEmojiPicker,
    replyingTo: state.replyingTo,
    editingMsg: state.editingMsg,
    lightboxUrl: state.lightboxUrl,
    contextMenu: state.contextMenu,
    deleteTarget: state.deleteTarget,
    forwardTarget: state.forwardTarget,
    groupInfoOpen: state.groupInfoOpen,
    blockConfirmOpen: state.blockConfirmOpen,
    reportConfirmOpen: state.reportConfirmOpen,
    readReceiptTarget: state.readReceiptTarget,
    reactingMsgId: state.reactingMsgId,
    selectedIds: state.selectedIds,
    searchMatchIds: state.searchMatchIds,
    activeMatchIndex: state.activeMatchIndex,
    searchQuery: state.searchQuery,
    chatName: state.chatName,
    otherUserId: state.otherUserId,
    selectedImage: state.selectedImage,
    selectedFile: state.selectedFile,
    imagePreview: state.imagePreview,
    replyingToForSend: state.replyingTo,
    setInput: state.setInput,
    setShowSearch: state.setShowSearch,
    setSearchQuery: state.setSearchQuery,
    setShowEmojiPicker: state.setShowEmojiPicker,
    setReplyingTo: state.setReplyingTo,
    setEditingMsg: state.setEditingMsg,
    setLightboxUrl: state.setLightboxUrl,
    setContextMenu: state.setContextMenu,
    setDeleteTarget: state.setDeleteTarget,
    setForwardTarget: state.setForwardTarget,
    setForwardSearch: state.setForwardSearch,
    setGroupInfoOpen: state.setGroupInfoOpen,
    setBlockConfirmOpen: state.setBlockConfirmOpen,
    setReportConfirmOpen: state.setReportConfirmOpen,
    setReadReceiptTarget: state.setReadReceiptTarget,
    setReactingMsgId: state.setReactingMsgId,
    setReactionPickerRect: state.setReactionPickerRect,
    setSelectedIds: state.setSelectedIds,
    setSearchMatches: state.setSearchMatches,
    setActiveMatchIndex: state.setActiveMatchIndex,
    setMuted: state.setMuted,
    setSelectedImage: state.setSelectedImage,
    setImagePreview: state.setImagePreview,
    setSelectedFile: state.setSelectedFile,
    typingTimerRef: state.typingTimerRef,
    typingDoneTimerRef: state.typingDoneTimerRef,
    messagesEndRef: state.messagesEndRef,
    searchInputRef: state.searchInputRef,
    emojiPickerRef: state.emojiPickerRef,
    emojiToggleRef: state.emojiToggleRef,
    scrollTriggerRef: state.scrollTriggerRef,
    prevLastMsgIdRef: state.prevLastMsgIdRef,
    longPressTimerRef: state.longPressTimerRef,
    longPressStartPosRef: state.longPressStartPosRef,
    sendMutation: mutations.sendMutation,
    sendImageMutation: mutations.sendImageMutation,
    sendFileMutation: mutations.sendFileMutation,
    editMutation: mutations.editMutation,
    deleteMutation: mutations.deleteMutation,
    pinMutation: mutations.pinMutation,
    unpinMutation: mutations.unpinMutation,
    starMutation: mutations.starMutation,
    unstarMutation: mutations.unstarMutation,
    toggleReactionMutation: mutations.toggleReactionMutation,
    forwardMutation: mutations.forwardMutation,
    refetchPinned: mutations.refetchPinned,
    setPinnedMessages: state.setPinnedMessages,
    hasNextPage: state.hasNextPage,
    isFetchingNextPage: state.isFetchingNextPage,
    fetchNextPage: state.fetchNextPage,
  });

  // Socket: join/leave room, set current chat, emit seen
  useEffect(() => {
    if (!state.chatId) return;

    setCurrentChat(state.chatId, state.isDM);
    joinRoom(state.chatId);

    return () => {
      joinAllConversationRooms();
      emitSeenForConversation(state.chatId, state.isDM, undefined, true);
      setCurrentChat(null, false);
      sessionStorage.removeItem(`scrollPos-${state.chatId}`);
    };
  }, [state.chatId, state.isDM]);

  // Dikeluarkan/di-remove dari grup atau grup di-dismiss → kembali ke daftar chat.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ conversationId: string }>).detail;
      if (detail?.conversationId && detail.conversationId === state.chatId) {
        navigate('/');
      }
    };
    window.addEventListener('chat:forced-leave', handler);
    return () => window.removeEventListener('chat:forced-leave', handler);
  }, [state.chatId, navigate]);

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        chatName={!state.isDM && mutations.group?.name ? mutations.group.name : state.chatName}
        typingLabel={state.typingLabel}
        chatOnline={state.chatOnline}
        isDM={state.isDM}
        muted={state.muted}
        userId={state.otherUserId}
        lastSeen={state.chatLastSeen}
        memberCount={mutations.group?.members?.length ?? state.memberCount}
        avatarUrl={!state.isDM ? mutations.group?.avatarUrl : undefined}
        onBack={() => navigate('/')}
        onSearchToggle={() => {
          if (state.showSearch) {
            state.setSearchQuery('');
            state.setShowSearch(false);
          } else {
            state.setShowSearch(true);
          }
        }}
        onToggleMute={() => state.setMuteDialogOpen(true)}
        onBlockClick={() => state.setBlockConfirmOpen(true)}
        onReportClick={() => state.setReportConfirmOpen(true)}
        onGroupInfoClick={() => state.setGroupInfoOpen(true)}
        onClearChat={() => state.setClearConfirmOpen(true)}
      />

      {state.showSearch && (
        <ChatSearchBar
          searchQuery={state.searchQuery}
          searchMatches={state.searchMatches}
          activeMatchIndex={state.activeMatchIndex}
          inputRef={state.searchInputRef as React.RefObject<HTMLInputElement>}
          onSearchChange={state.setSearchQuery}
          onPreviousMatch={() => {
            const next =
              (state.activeMatchIndex - 1 + state.searchMatches.length) %
              Math.max(state.searchMatches.length, 1);
            state.setActiveMatchIndex(next);
            actions.scrollToMatch(next);
          }}
          onNextMatch={() => {
            const next =
              (state.activeMatchIndex + 1) % Math.max(state.searchMatches.length, 1);
            state.setActiveMatchIndex(next);
            actions.scrollToMatch(next);
          }}
          onClear={() => {
            state.setSearchQuery('');
            state.setSearchMatches([]);
            state.setActiveMatchIndex(0);
          }}
        />
      )}

      <PinnedBanner
        pinnedMessages={state.pinnedMessages}
        onUnpin={(id) => mutations.unpinMutation.mutate(id)}
        onScrollTo={(id) => {
          document
            .getElementById(`msg-${id}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      {state.selectedIds.length > 0 && (
        <div className="flex items-center gap-3 border-b border-border bg-sidebar/80 px-4 py-2 text-xs">
          <span className="font-medium text-foreground">
            {state.selectedIds.length} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={actions.handleBulkForward}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-accent/10"
            >
              Forward
            </button>
            <button
              onClick={actions.handleBulkDelete}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-destructive transition-colors hover:bg-destructive/10"
            >
              Delete
            </button>
            <button
              onClick={() => state.setSelectedIds([])}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <MessageList
        highlightedMsgId={highlightedMsgId}
        chatId={state.chatId}
        isDM={state.isDM}
        filteredMessages={state.filteredMessages}
        searchQuery={state.searchQuery}
        isPending={state.isPending}
        isError={state.isError}
        error={state.error}
        isFetchingNextPage={state.isFetchingNextPage}
        hasNextPage={state.hasNextPage}
        hasActiveSearch={state.hasActiveSearch}
        searchMatchIds={state.searchMatchIds}
        activeMatchIndex={state.activeMatchIndex}
        typingUsers={state.typers ?? []}
        currentUserId={state.currentUser?.id}
        onRetry={() => state.refetch()}
        scrollTriggerRef={
          state.scrollTriggerRef as React.RefObject<HTMLDivElement>
        }
        messagesEndRef={
          state.messagesEndRef as React.RefObject<HTMLDivElement>
        }
        onContextMenu={(msg, x, y) => state.setContextMenu({ msg, x, y })}
        onLongPressStart={actions.handleLongPressStart}
        onLongPressMove={actions.handleLongPressMove}
        onLongPressEnd={actions.handleLongPressEnd}
        onTouchStart={actions.handleTouchStart}
        onTouchMove={actions.handleTouchMove}
        onTouchEnd={actions.handleTouchEnd}
        onClickImage={(url) => state.setLightboxUrl(url)}
        onToggleReaction={actions.handleToggleReaction}
        onReactionPickerOpen={actions.handleReactionPickerOpen}
        selectedIds={state.selectedIds}
        toggleSelect={actions.toggleSelect}
      />

      <ChatInput
        input={state.input}
        replyingTo={state.replyingTo}
        editingMsg={state.editingMsg}
        imagePreview={state.imagePreview}
        selectedImage={state.selectedImage}
        selectedFile={state.selectedFile}
        showEmojiPicker={state.showEmojiPicker}
        onInputChange={state.setInput}
        onSend={actions.handleSend}
        onSendImage={actions.handleSendImage}
        onUpdateEdit={actions.handleUpdateEdit}
        onCancelReply={actions.handleCancelReply}
        onCancelEdit={actions.handleCancelEdit}
        onCancelImage={actions.handleCancelImage}
        onImageSelect={actions.handleImageSelect}
        onFileSelect={actions.handleFileSelect}
        onEmojiToggle={() => state.setShowEmojiPicker((v) => !v)}
        onEmojiClick={actions.handleEmojiClick}
        emojiPickerRef={
          state.emojiPickerRef as React.RefObject<HTMLDivElement>
        }
        emojiToggleRef={
          state.emojiToggleRef as React.RefObject<HTMLButtonElement>
        }
        fileInputRef={
          state.fileInputRef as React.RefObject<HTMLInputElement>
        }
        imageInputRef={
          state.imageInputRef as React.RefObject<HTMLInputElement>
        }
      />

      {state.reactingMsgId && state.reactionPickerRect && (
        <ReactionPicker
          onReact={actions.handleReactionPickerSelect}
          onClose={actions.handleReactionPickerClose}
          anchorRect={state.reactionPickerRect}
        />
      )}

      <ChatOverlays
        deleteTarget={state.deleteTarget}
        deleteLoading={state.deleteLoading}
        contextMenu={state.contextMenu}
        forwardTarget={state.forwardTarget}
        forwardSearch={state.forwardSearch}
        forwardableConversations={mutations.forwardableConversations}
        lightboxUrl={state.lightboxUrl}
        blockConfirmOpen={state.blockConfirmOpen}
        reportConfirmOpen={state.reportConfirmOpen}
        clearConfirmOpen={state.clearConfirmOpen}
        groupInfoOpen={state.groupInfoOpen}
        readReceiptTarget={state.readReceiptTarget}
        group={mutations.group}
        chatName={state.chatName}
        chatId={state.chatId}
        currentUserId={state.currentUser?.id}
        onCloseDelete={() => {
          if (!state.deleteLoading) state.setDeleteTarget(null);
        }}
        onDeleteMessage={actions.handleDeleteMessage}
        onCloseContextMenu={() => state.setContextMenu(null)}
        onContextMenuAction={actions.handleContextMenuAction}
        onCloseForward={() => {
          state.setForwardTarget(null);
          state.setForwardSearch('');
        }}
        onForwardSearchChange={state.setForwardSearch}
        onForward={actions.handleForward}
        onCloseLightbox={() => state.setLightboxUrl(null)}
        onCloseBlock={() => state.setBlockConfirmOpen(false)}
        onBlock={actions.handleBlock}
        onCloseReport={() => state.setReportConfirmOpen(false)}
        onReport={actions.handleReport}
        onCloseClear={() => state.setClearConfirmOpen(false)}
        onClear={() => {
          state.setClearConfirmOpen(false);
          mutations.clearChatMutation.mutate();
        }}
        muteDialogOpen={state.muteDialogOpen}
        muted={state.muted}
        onCloseMute={() => state.setMuteDialogOpen(false)}
        onMute={actions.handleMute}
        onCloseGroupInfo={() => state.setGroupInfoOpen(false)}
        onCloseReadReceipts={() => state.setReadReceiptTarget(null)}
        onUpdateGroup={(data) =>
          mutations.updateGroupMutation.mutateAsync(data)
        }
        onAddMember={(userId) =>
          mutations.addMemberMutation.mutateAsync(userId)
        }
        onRemoveMember={(userId) =>
          mutations.removeMemberMutation.mutateAsync(userId)
        }
        onLeaveGroup={() => mutations.leaveGroupMutation.mutateAsync()}
        onDeleteGroup={() => mutations.deleteGroupMutation.mutateAsync()}
        onUpdateMemberRole={(userId, role) =>
          mutations.updateMemberRoleMutation.mutateAsync({ userId, role })
        }
        searchUsers={actions.handleSearchUsers}
      />
    </div>
  );
}
