import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { fetchChats, setActiveChat, togglePinChat, reorderPinned } from '../store/chatSlice';
import ChatItem from './ChatItem';
import NewChatModal from './NewChatModal';

const Sidebar = ({ searchQuery = '' }) => {
  const dispatch = useDispatch();
  const { list, loading, pinnedChats } = useSelector((state) => state.chats);
  const activeChatId = useSelector((state) => state.chats.activeChat);
  const [showNewChat, setShowNewChat] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  const q = searchQuery.toLowerCase().trim();
  const filtered = q ? list.filter(c => c.name?.toLowerCase().includes(q)) : list;

  const pinnedList = pinnedChats
    .map(id => filtered.find(c => c.id === id))
    .filter(Boolean);
  const unpinnedList = filtered.filter(c => !pinnedChats.includes(c.id));

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = pinnedChats.indexOf(active.id);
    const newIdx = pinnedChats.indexOf(over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      dispatch(reorderPinned(arrayMove(pinnedChats, oldIdx, newIdx)));
    }
  };

  return (
    <div className="w-full md:w-[360px] bg-[#373737] flex flex-col h-full flex-shrink-0">
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {pinnedList.length > 0 && (
              <>
                <div className="text-[11px] text-gray-500 px-2 py-1 uppercase tracking-wider">
                  Закреплённые
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={pinnedChats} strategy={verticalListSortingStrategy}>
                    {pinnedList.map(chat => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        isActive={activeChatId === chat.id}
                        isPinned={true}
                        onClick={() => dispatch(setActiveChat(chat.id))}
                        onTogglePin={() => dispatch(togglePinChat(chat.id))}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                {unpinnedList.length > 0 && (
                  <div className="border-t border-[#555] my-2" />
                )}
              </>
            )}

            {unpinnedList.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={activeChatId === chat.id}
                isPinned={false}
                onClick={() => dispatch(setActiveChat(chat.id))}
                onTogglePin={() => dispatch(togglePinChat(chat.id))}
              />
            ))}
          </>
        )}
      </div>

      <div className="border-t border-[#222] bg-[#484849]">
        <button
          onClick={() => setShowNewChat(true)}
          className="w-full bg-[#484849] hover:bg-[#555] text-white font-medium py-3 px-4 transition text-[25px] text-center"
        >
          Новый чат
        </button>
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </div>
  );
};

export default Sidebar;
