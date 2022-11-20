import classNames from 'classnames';
import { DateTime, Duration } from 'luxon';
import React from 'react'
import { FriendlyDate } from '../../../../pages';
import { IChatMessages, IMessage, IToken } from '../../../interfaces';
import styles from '../TeamsAppPage.module.css'
import ModalReaction from './ModalReaction';
import { FcPhone, FcEndCall, FcClock, FcEnteringHeavenAlive, FcCamcorder, FcVideoFile, FcVideoCall, FcSignature } from 'react-icons/fc';

interface Props {
  selectedChat?: IChatMessages;
  meId: string;
  token: string;
  handleAlerts: (msg: any, type?: "default" | "info" | "success" | "warning" | "error" | undefined, timeMs?: number | undefined) => void;
  handleUpdateMessage: (chatId: string, msgId: string) => void;
}

export default function ChatMessages({ selectedChat, meId, token, handleAlerts, handleUpdateMessage }: Props) {

  if (!selectedChat) return <ChatNotSelected />

  const msgsNotDeleted = selectedChat?.messages.filter(msg => !msg.deletedDateTime);

  const groupChatMembers = selectedChat.chat.members.map(member => member.displayName).join(', ');

  const MyMessage = ({ msg }: { msg: IMessage }) => {
    return (
      <div className='d-flex flex-row'>
        <div className='w-25' />
        <div className={classNames(['w-75', styles.chat_message_item, styles.my_message])}>
          <span className={styles.msg_from}>
            <FriendlyDate date={DateTime.fromISO(msg.createdDateTime)} />
            <ModalReaction
              handleUpdateMessage={handleUpdateMessage}
              chatId={selectedChat.chat.id}
              msg={msg}
              token={token}
              handleAlerts={handleAlerts} />
          </span>
          <Message bodyContent={msg.body.content} />
        </div>
      </div>
    )
  }

  const OthersMessage = ({ msg }: { msg: IMessage }) => {
    return (
      <div className='d-flex flex-row'>
        <div className={classNames(['w-75', styles.chat_message_item, styles.others_message])}>
          <span className={styles.msg_from}>
            {selectedChat.chat.chatType === 'group' ? <>{msg.from.user.displayName}</> : null}
            <FriendlyDate date={DateTime.fromISO(msg.createdDateTime)} />
            <ModalReaction
              handleUpdateMessage={handleUpdateMessage}
              chatId={selectedChat.chat.id}
              msg={msg}
              token={token}
              handleAlerts={handleAlerts} />
          </span>
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
      </div >
    </>
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