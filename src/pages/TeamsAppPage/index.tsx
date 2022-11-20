import classNames from 'classnames';
import React, { useEffect, useState } from 'react'
import { IChat, IChatMessages, IChatsState, ILoadingTeamsApp, IMe, IMessage, IToken } from '../../interfaces';
import { GetChatMessage, GetChatMessages, GetChats, GetViaUrl } from '../../services/graphRequests';
import ChatList from './ChatList';
import ChatMessages from './ChatMessages';
import Header from './Header';
import styles from './TeamsAppPage.module.css';

interface Props {
  me: IMe;
  token: string;
  handleLogout: () => void;
  handleAlerts: (msg: any, type?: 'default' | 'info' | 'success' | 'warning' | 'error', timeMs?: number) => void;
}

export default function TeamsAppPage({ me, token, handleLogout, handleAlerts }: Props) {

  const [chats, setChats] = useState<IChatsState>({ nextLink: '', items: undefined });
  const [loading, setLoading] = useState<ILoadingTeamsApp>({ chats: false, moreChats: false, chatMessages: false });
  const [selectedChat, selectChat] = useState<IChatMessages>();

  const handleGetChats = () => {
    setLoading(p => ({ ...p, chats: true }));
    GetChats(token)
      .then(chatsData => {
        const newChats: IChat[] = chatsData.data.value;
        setChats({
          items: handleAddChats(newChats, me),
          nextLink: chatsData?.data?.["@odata.nextLink"] || ''
        });
      })
      .catch(e => { handleAlerts(e, 'error') })
      .finally(() => {
        setLoading(p => ({ ...p, chats: false }));
      })
  }

  const handleSelectChat = (id: string) => {
    setLoading(p => ({ ...p, chatMessages: true }));
    GetChatMessages(id, token)
      .then(chatMessagesData => {
        const cm = chatMessagesData.data;
        function sortByTime(a: any, b: any) {
          if (a.createdDateTime < b.createdDateTime) return 1;
          if (a.createdDateTime > b.createdDateTime) return -1;
          return 0;
        }
        selectChat({
          chat: chats.items?.filter(c => c.id === id)[0] as IChat,
          messages: cm.value.sort(sortByTime),
          nextLink: cm["@odata.nextLink"],
        });
      })
      .catch(e => { handleAlerts(e, 'error') })
      .finally(() => {
        setLoading(p => ({ ...p, chatMessages: false }))
      })

  }

  const handleGetMoreChats = () => {
    setLoading(p => ({ ...p, moreChats: true }));
    GetViaUrl(chats.nextLink, token)
      .then(chatsData => {
        console.log(chatsData.data);
        const newChats: IChat[] = chatsData.data.value;
        const allChats = chats && chats?.items?.length ? [...chats.items, ...newChats] : newChats;
        setChats({
          items: handleAddChats(allChats, me),
          nextLink: chatsData?.data?.["@odata.nextLink"] || ''
        });
      })
      .catch(e => { handleAlerts(e, 'error') })
      .finally(() => {
        setLoading(p => ({ ...p, moreChats: false }));
      })

  }

  const handleUpdateMessage = (chatId: string, msgId: string) => {

    GetChatMessage(chatId, msgId, token)
      .then(resp => {
        const newMessage: IMessage = resp.data;
        selectChat(prev => {
          if(!prev) return prev;
          const indexMsg = prev.messages.findIndex(msg => msg.id === msgId)
          if(!indexMsg && indexMsg !== 0) return prev;
          let newMessages = prev.messages;
          newMessages[indexMsg].reactions = newMessage.reactions;

          return {
            ...prev,
            messages: newMessages,
          }
        })
        console.log(newMessage);
      })
      .catch(e => handleAlerts(e, 'error'))

  }

  useEffect(handleGetChats, []);

  return (
    <div className='container-fluid'>
      <Header me={me} handleLogout={handleLogout} tokenExp={GetJwt(token)?.expires} />

      <div className={classNames(['row', styles.row_chat])}>
        <div className={`col-3 p-2 ${styles.chat_list_screen} ${styles.blue_scroll}`}>
          <ChatList
            handleGetMoreChats={handleGetMoreChats}
            loading={loading}
            handleGetChats={handleGetChats}
            handleSelectChat={handleSelectChat}
            selectedChat={selectedChat}
            chats={chats} />
        </div>
        <div className={`col-9 ${styles.chat_row_messages} ${styles.blue_scroll}`}>
          <ChatMessages
            selectedChat={selectedChat}
            meId={me.id}
            token={token}
            handleUpdateMessage={handleUpdateMessage}
            handleAlerts={handleAlerts} />
        </div>
      </div>
    </div>
  )
}

function GetJwt(token: string): IToken['jwt'] | null {

  if (token && token.includes('.')) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = JSON.parse(decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      ));

      return {
        expires: jsonPayload.exp,
        name: jsonPayload.name,
        given_name: jsonPayload.given_name,
        email: jsonPayload?.unique_name || jsonPayload.upn
      };

    } catch (e) { return null; }
  } else return null;
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