import classNames from 'classnames';
import React, { useState } from 'react'
import { IChatMessages, IMe, THandleAlerts } from '../../../interfaces';
import styles from '../TeamsAppPage.module.css'
import { GetViaUrl } from '../../../services/graphRequests';
import { Button } from 'react-bootstrap';
import Msg from './Msg'
import { byCreatedDateTime } from '..';

interface Props {
  me: IMe;
  token: string;
  selectedChat?: IChatMessages;
  handleAlerts: THandleAlerts;
}

export default function ChatMessages({ selectedChat, me, token, handleAlerts }: Props) {

  const [loadingMsg, setLoadingMsg] = useState(false);
  const [chatMessages, setChatMessages] = useState({ items: selectedChat?.messages || [], nextLink: selectedChat?.nextLink })

  if (!selectedChat) return <ChatNotSelected />
  if (!chatMessages || !chatMessages.items.length) return <NoMessages />

  const groupChatMembers = selectedChat.chat.members.map(member => member.displayName).join(', ');

  function handleGetMoreMessages() {
    if (!chatMessages.nextLink) return;
    setLoadingMsg(true);
    GetViaUrl(chatMessages.nextLink, token)
      .then(chatMessagesData =>
        setChatMessages(prev => {
          const cm = chatMessagesData.data;
          return {
            items: [...prev.items, ...cm.value.sort(byCreatedDateTime)],
            nextLink: cm?.['@odata.nextLink'] || undefined
          }
        }
        )
      )
      .catch(e => handleAlerts(e, 'error'))
      .finally(() => setLoadingMsg(false))
  }

  const msgsNotDeleted = chatMessages.items.filter(msg => !msg.deletedDateTime);

  console.log(selectedChat)

  /** Armazena o último usuário que teve a mensagem renderizada.
   * Isso serve para mensagens do mesmo usuário ficarem mais juntas e sem os seus nomes nas repetidas.
  */
  let idUserAbove = '';

  return (
    <>
      <div className={styles.chat_topic}>
        <span className={styles.chat_topic_title}>{selectedChat.chat.topic}</span>
        {selectedChat.chat.chatType === "meeting" || selectedChat.chat.chatType === "group" ?
          <span className={styles.chat_topic_members} title={groupChatMembers}>{groupChatMembers}</span>
          : null}
      </div>

      <div className={classNames([styles.chat_messages, styles.blue_scroll])}>

        {msgsNotDeleted?.map(msg => {

          const sameUserBelow = idUserAbove === msg.from?.user?.id || idUserAbove === msg.from?.application?.id;
          if (!sameUserBelow) idUserAbove = msg.from?.user?.id || msg.from?.application?.id;

          return <Msg
            msg={msg} me={me}
            key={msg.id} token={token}
            handleAlerts={handleAlerts}
            chat={selectedChat.chat}
            sameUserBelow={!sameUserBelow} />

        })}

        {chatMessages.nextLink ?
          <Button
            disabled={loadingMsg}
            className={styles.btn_get_more_messages}
            onClick={handleGetMoreMessages}>
            {loadingMsg ? 'Obtendo...' : 'Obter mais mensagens...'}
          </Button> : null
        }
      </div >
    </>
  )
}

const ChatNotSelected = () => (
  <div className='w-100 h-100 d-flex align-items-center justify-content-center'>
    <span className='text-muted'>Selecione uma conversa ao lado...</span>
  </div>
)

const NoMessages = () => (
  <div className='w-100 h-100 d-flex align-items-center justify-content-center'>
    <span className='text-muted'>Não há nenhuma mensagem nessa conversa</span>
  </div>
)