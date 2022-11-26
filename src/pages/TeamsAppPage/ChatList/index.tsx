import React, { useEffect, useState } from 'react'
import { TbRefresh } from 'react-icons/tb';
import { IChat, IChatMessages, IChatsState, IMe, THandleAlerts } from '../../../interfaces';
import { GetChats, GetViaUrl } from '../../../services/graphRequests';
import styles from '../TeamsAppPage.module.css';
import Form from 'react-bootstrap/Form'
import Spinner from '../../../components/Spinner';

interface Props {
  me: IMe
  token: string;
  selectedChat?: IChatMessages;
  loadingMessages: boolean;
  handleChangeChat(chat: IChat): void;
  handleAlerts: THandleAlerts;
}

export default function ChatList({ token, selectedChat, me, handleChangeChat, loadingMessages, handleAlerts }: Props) {

  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<IChatsState>();
  const [search, setSearch] = useState('');

  const handleGetChats = () => {
    setLoading(true);
    GetChats(token)
      .then(chatsData => {
        const newChats: IChat[] = chatsData.data.value;
        setChats({
          items: handleAddChats(newChats, me),
          nextLink: chatsData?.data?.["@odata.nextLink"] || ''
        });
      })
      .catch(e => handleAlerts(e, 'error'))
      .finally(() => setLoading(false))
  }

  const handleGetMoreChats = () => {
    if (!chats?.nextLink) return;
    setLoading(true);
    GetViaUrl(chats.nextLink, token)
      .then(chatsData => {
        const newChats: IChat[] = chatsData.data.value;
        const allChats = chats && chats?.items?.length ? [...chats.items, ...newChats] : newChats;
        setChats({
          items: handleAddChats(allChats, me),
          nextLink: chatsData?.data?.["@odata.nextLink"] || ''
        });
      })
      .catch(e => handleAlerts(e, 'error'))
      .finally(() => setLoading(false))

  }

  useEffect(handleGetChats, []);

  const filteredChats = search && chats?.items ? chats.items?.filter(c => (c?.topic || '').toLowerCase().includes(search.toLowerCase())) : chats?.items;

  return (
    <>
      <div className='d-flex flex-row justify-content-between align-items-center'>
        <h2 className='fs-2'>Chats</h2>
        <button
          disabled={loading || loadingMessages}
          onClick={handleGetChats}
          title='Atualizar todos os chats'
          className='btn btn-dark d-flex align-items-center fs-4'>
          <TbRefresh className={loading || loadingMessages ? styles.spin : ''} />
        </button>
      </div>

      <div className="mt-3">
        <Form.Control
          id='txtSearch'
          value={search}
          onChange={e => setSearch(e.target.value)}
          type='search'
          className='bg-dark text-light'
          placeholder='Pesquisar chat...'
        />

      </div>
      <div className="mt-2 d-flex flex-column chats">
        {filteredChats?.map(chat => (
          <button
            key={chat.id}
            disabled={loading || loadingMessages}
            onClick={() => handleChangeChat(chat)}
            className={`btn btn-dark ${styles.chat_button} ${selectedChat?.chat.id === chat.id ? 'active' : ''}`}>
            <span className={styles.chat_button_topic}>{chat.topic}</span>
          </button>
        ))}

        {chats && chats.nextLink ?
          <button
            disabled={loading || loadingMessages}
            onClick={handleGetMoreChats}
            className='btn btn-outline-light'>{loading ? <><Spinner /> Obtendo...</> : 'Obter mais...'}</button>
          : null}

      </div>
    </>
  )
}

const handleAddChats = (chats: IChat[], me: IMe) => {

  const newChats = chats.map(chat => {

    let topic: string = chat.topic || '';

    const membersWithoutMe = chat.members.filter(member => member.userId !== me?.id)

    if (chat.chatType === 'oneOnOne' && chat.members.length > 1) {

      topic = membersWithoutMe
        .map(member => member.displayName)
        .join(', ')

    } else if (chat.chatType === 'group' && !chat.topic) {

      topic = membersWithoutMe
        .map(member => member.displayName.split(' ')[0])
        .join(', ')
    }

    if (!topic) {
      console.groupCollapsed('Não consegui obter o tópico desse:')
      console.log(chat);
      console.groupEnd();
    }

    return { ...chat, topic }

  });

  const allChats = [...chats, ...newChats];
  return Array.from(new Map(allChats.map(item => [item['id'], item])).values())

}
