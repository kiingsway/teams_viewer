import React, { useState } from 'react'
import { TbRefresh } from 'react-icons/tb';
import Input from '../../../components/Input';
import { IChatMessages, IChatsState, ILoadingTeamsApp } from '../../../interfaces';
import styles from '../TeamsAppPage.module.css';

interface Props {
  loading: ILoadingTeamsApp;
  handleGetChats: () => void;
  chats: IChatsState;
  handleSelectChat: (id: string) => void;
  selectedChat?: IChatMessages;
  handleGetMoreChats: () => void;
  selectChat: React.Dispatch<React.SetStateAction<IChatMessages | undefined>>;
}

export default function ChatList({ loading, handleGetChats, chats, handleSelectChat, selectedChat, handleGetMoreChats }: Props) {

  const [search, setSearch] = useState('');

  const filteredChats = search ? chats.items?.filter(c => (c?.topic || '').toLowerCase().includes(search.toLowerCase())) : chats.items;

  return (
    <>
      <div className='d-flex flex-row justify-content-between align-items-center'>
        <h2 className='fs-2'>Chats</h2>
        <button
          disabled={loading.chats || loading.moreChats || loading.chatMessages}
          onClick={handleGetChats}
          title='Atualizar todos os chats'
          className='btn btn-dark d-flex align-items-center fs-4'>
          <TbRefresh />
        </button>
      </div>

      <div className="mt-3">
        <Input
          id='txtSearch'
          value={search}
          onChange={e => setSearch(e.target.value)}
          labelText='Pesquisar chat'
          type='search'
        />
      </div>
      <div className="mt-2 d-flex flex-column chats">
        {filteredChats?.map(chat => (
          <button
            key={chat.id}
            disabled={loading.chats || loading.moreChats || loading.chatMessages}
            onClick={() => handleSelectChat(chat.id)}
            className={`btn btn-dark ${styles.chat_button} ${selectedChat?.chat.id === chat.id ? 'active' : ''}`}>{chat.topic}</button>
        ))}

        {chats.nextLink ?
          <button
            disabled={loading.chats || loading.moreChats || loading.chatMessages}
            onClick={handleGetMoreChats}
            className='btn btn-outline-light'>{loading.moreChats ? 'Obtendo...' : 'Obter mais...'}</button>
          : null}

      </div>
    </>
  )
}
