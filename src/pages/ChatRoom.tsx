import { useNavigate } from 'react-router-dom';
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

export default function ChatRoom() {
  const navigate = useNavigate();
  const state = useChatState();

  const mutations = useChatMutations({
    chatId: state.chatId,
    isDM: state.isDM,
    deleteTarget: state.deleteTarget,
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
    muted: state.muted,
    chatName: state.chatName,
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
    toggleReactionMutation: mutations.toggleReactionMutation,
    forwardMutation: mutations.forwardMutation,
    refetchPinned: mutations.refetchPinned,
    setPinnedMessages: state.setPinnedMessages,
    hasNextPage: state.hasNextPage,
    isFetchingNextPage: state.isFetchingNextPage,
    fetchNextPage: state.fetchNextPage,
  });

  return (
    <div
      className="flex h-full flex-col"
      style={{ paddingBottom: state.keyboardHeight }}
    >
      <ChatHeader
        chatName={state.chatName}
        otherTyping={state.otherTyping}
        chatOnline={state.chatOnline}
        isDM={state.isDM}
        muted={state.muted}
        userId={state.otherUserId}
        lastSeen={state.chatLastSeen}
        onBack={() => navigate(-1)}
        onSearchToggle={() => {
          if (state.showSearch) {
            state.setSearchQuery('');
            state.setShowSearch(false);
          } else {
            state.setShowSearch(true);
          }
        }}
        onToggleMute={actions.handleToggleMute}
        onBlockClick={() => state.setBlockConfirmOpen(true)}
        onReportClick={() => state.setReportConfirmOpen(true)}
        onGroupInfoClick={() => state.setGroupInfoOpen(true)}
        onClearChat={() => mutations.clearChatMutation.mutate()}
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
        otherTyping={state.otherTyping}
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
