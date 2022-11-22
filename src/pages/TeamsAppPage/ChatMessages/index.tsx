import classNames from 'classnames';
import { DateTime, Duration } from 'luxon';
import React, { useState } from 'react'
import { FriendlyDate } from '../../../../pages';
import { IChatMessages, IMessage, IReaction, THandleAlerts } from '../../../interfaces';
import styles from '../TeamsAppPage.module.css'
import ModalReaction from './ModalReaction';
import { FcPhone, FcEndCall, FcClock, FcEnteringHeavenAlive, FcCamcorder, FcVideoFile, FcVideoCall, FcSignature } from 'react-icons/fc';
import emojis from '../../../components/emojis.json';
import { GetChatMessage, GetViaUrl } from '../../../services/graphRequests';
import { sortByTime } from '..';
import { Button } from 'react-bootstrap';

interface Props {
  selectedChat?: IChatMessages;
  meId: string;
  token: string;
  handleAlerts: THandleAlerts;
  selectChat: React.Dispatch<React.SetStateAction<IChatMessages | undefined>>;
}

export default function ChatMessages({ selectedChat, meId, token, handleAlerts, selectChat }: Props) {

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
            items: [...prev.items, ...cm.value.sort(sortByTime)],
            nextLink: cm?.['@odata.nextLink'] || undefined
          }
        }
        )
      )
      .catch(e => handleAlerts(e, 'error'))
      .finally(() => setLoadingMsg(false))
  }

  const handleUpdateMessage = (chatId: string, msgId: string) => {

    GetChatMessage(chatId, msgId, token)
      .then(resp => {
        const newMessage: IMessage = resp.data;
        selectChat(prev => {
          if (!prev) return prev;
          const indexMsg = prev.messages.findIndex(msg => msg.id === msgId)
          if (!indexMsg && indexMsg !== 0) return prev;
          let newMessages = prev.messages;
          newMessages[indexMsg].reactions = newMessage.reactions;

          return {
            ...prev,
            messages: newMessages,
          }
        });
      })
      .catch(e => handleAlerts(e, 'error'))

  }

  const MyMessage = ({ msg }: { msg: IMessage }) => {

    return (
      <div className='d-flex flex-row'>
        <div className='w-25' />
        <div className={classNames(['w-75', styles.chat_message_item, styles.my_message])}>
          <div className={styles.msg_from}>
            <EmojisOnMessage reactions={msg.reactions} />
            <ModalReaction
              handleUpdateMessage={handleUpdateMessage}
              chatId={selectedChat.chat.id}
              msg={msg}
              token={token}
              handleAlerts={handleAlerts} />
            <FriendlyDate date={DateTime.fromISO(msg.createdDateTime)} />
          </div>
          <Message bodyContent={msg.body.content} />
        </div>
      </div>
    )
  }

  const OthersMessage = ({ msg }: { msg: IMessage }) => {
    return (
      <div className='d-flex flex-row'>
        <div className={classNames(['w-75', styles.chat_message_item, styles.others_message])}>
          <div className={styles.msg_from}>
            <span className={styles.chat_user}>{selectedChat.chat.chatType === 'group' ? <>{msg.from.user.displayName}</> : null}</span>
            <FriendlyDate date={DateTime.fromISO(msg.createdDateTime)} />
            <ModalReaction
              handleUpdateMessage={handleUpdateMessage}
              chatId={selectedChat.chat.id}
              msg={msg}
              token={token}
              handleAlerts={handleAlerts} />
            <EmojisOnMessage reactions={msg.reactions} />
          </div>
          <Message bodyContent={msg.body.content} />
        </div>
        <div className='w-25' />
      </div>
    )
  }

  const SystemMessage = ({ msg }: { msg: IMessage }) => {
    const eventDetail = summarizeEvent(msg.eventDetail)

    return (
      <div className='d-flex flex-row'>
        <div className={styles.system_message}>
          <FriendlyDate date={DateTime.fromISO(msg.createdDateTime)} />
          <span>{eventDetail?.icon}</span>
          <span>{eventDetail?.message}</span>
          {eventDetail?.type === 'callEnded' ? (
            <>
              <FcClock />
              <span>
                {Duration.fromISO(msg.eventDetail.callDuration).toHuman()}
              </span>
            </>
          ) : null}
          {/* <ModalReaction
            chatId={selectedChat.chat.id}
            msg={msg}
            token={token}
            handleAlerts={handleAlerts} /> */}
        </div>
      </div>
    )
  }

  const msgsNotDeleted = chatMessages.items.filter(msg => !msg.deletedDateTime);

  return (
    <>
      <div className={styles.chat_topic}>
        <span className={styles.chat_topic_title}>{selectedChat.chat.topic}</span>
        {selectedChat.chat.chatType !== '' ? <span className={styles.chat_topic_members} title={groupChatMembers}>{groupChatMembers}</span> : null}
      </div>

      <div className={classNames([styles.chat_messages, styles.blue_scroll])}>

        {msgsNotDeleted?.map(msg => {
          const msgFrom: 'mine' | 'others' | 'system' = msg.messageType === "systemEventMessage" ? 'system' : (msg.from?.user?.id === meId ? 'mine' : 'others');

          if (msgFrom === 'mine') return <MyMessage key={msg.id} msg={msg} />
          if (msgFrom === 'others') return <OthersMessage key={msg.id} msg={msg} />
          if (msgFrom === 'system') return <SystemMessage key={msg.id} msg={msg} />

          console.groupCollapsed('Mensagem não pôde ser renderizada')
          console.log(msg);
          console.groupEnd();

          return (
            <div className='d-flex flex-row' key={msg.id}>
              <div className={styles.system_message}>
                Não foi possível renderizar esta mensagem, cheque o console para mais detalhes...
              </div>
            </div>
          )
        })}

        {chatMessages.nextLink ?
          <Button
            disabled={loadingMsg}
            className={styles.btn_get_more_messages}
            onClick={handleGetMoreMessages}>
            Obter mais mensagens...
          </Button> : null
        }
      </div >
    </>
  )
}

const EmojisOnMessage = ({ reactions }: { reactions: IReaction[] }) => {


  const EmojiReaction = ({ r }: { r: IReaction }) => {

    const emojiReaction = emojis.filter(e => e.id === r.reactionType)[0]?.unicode || r.reactionType || '?'

    return (
      <span key={`${r.reactionType}${r.user.user.id}`}>
        {emojiReaction}
      </span>
    )
  }

  return (
    <div>
      {reactions.map(r => <EmojiReaction key={`${r.reactionType}${r.user.user.id}`} r={r} />)}
    </div>
  )

}

const Message = ({ bodyContent }: { bodyContent: string }) => {
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: bodyContent.replace('<img', '<img style="max-width:300px"') }} />
    </div>

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

const summarizeEvent = (eventDetail: any) => {

  if (eventDetail["@odata.type"] === "#microsoft.graph.callStartedEventMessageDetail")
    return {
      type: 'callStarted',
      message: 'Chamada iniciada',
      icon: <FcPhone />
    }

  if (eventDetail["@odata.type"] === "#microsoft.graph.callEndedEventMessageDetail")
    return {
      type: 'callEnded',
      message: 'Chamada encerrada',
      icon: <FcEndCall />
    }

  if (eventDetail["@odata.type"] === "#microsoft.graph.membersAddedEventMessageDetail")
    return {
      type: 'membersAdded',
      message: 'Membro adicionado',
      icon: <FcEnteringHeavenAlive />
    }

  if (eventDetail["@odata.type"] === "#microsoft.graph.callRecordingEventMessageDetail" && eventDetail?.callRecordingStatus === 'initial')
    return {
      type: 'callRecording',
      message: 'Gravação iniciada...',
      icon: <FcCamcorder />
    }

  if (eventDetail["@odata.type"] === "#microsoft.graph.callRecordingEventMessageDetail" && eventDetail?.callRecordingStatus === "chunkFinished")
    return {
      type: 'callRecording',
      message: 'Gravação encerrada. Salvando o vídeo...',
      icon: <FcVideoCall />
    }

  if (eventDetail["@odata.type"] === "#microsoft.graph.callRecordingEventMessageDetail" && eventDetail?.callRecordingStatus === "success")
    return {
      type: 'callRecording',
      message: 'Gravação concluída.',
      icon: <FcVideoFile />
    }

  if (eventDetail["@odata.type"] === "#microsoft.graph.chatRenamedEventMessageDetail")
    return {
      type: 'chatRenamed',
      message: `Chat renomeado: ${eventDetail.chatDisplayName}`,
      icon: <FcSignature />
    }
}