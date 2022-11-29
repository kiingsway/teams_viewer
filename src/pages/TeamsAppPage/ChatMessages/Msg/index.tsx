import classNames from 'classnames';
import { DateTime, Duration } from 'luxon';
import React, { useState } from 'react'
import { FcPhone, FcEndCall, FcCamcorder, FcVideoCall, FcVideoFile, FcSignature, FcClock, FcQuestions, FcDisapprove, FcGoodDecision, FcMediumPriority, FcKindle, FcFlashOff, FcFlashOn } from 'react-icons/fc';
import { IMessage, IMe, THandleAlerts, IChat } from '../../../../interfaces';
import styles from './Msg.module.css';
import FriendlyDate from './components/FriendlyDate';
import Reactions from './components/Reactions';
import ModalReaction from './components/ModalReaction';
import { GetChatMessage } from '../../../../services/graphRequests';
import Spinner from '../../../../components/Spinner';

interface Props {
  me: IMe;
  chat: IChat;
  msg: IMessage;
  token: string;
  sameUserBelow: boolean;
  handleAlerts: THandleAlerts;
}

interface IMsgFrom {
  type?: 'system' | 'mine' | 'others';
  from?: any;
}

export default function Message({ msg, me, token, chat, sameUserBelow, handleAlerts }: Props) {

  const [message, setMessage] = useState<IMessage>(msg)
  const [loading, setLoading] = useState(false);
  const msgFrom = summarizeMsgFrom(msg, me.id);

  async function handleUpdateMessage() {
    setLoading(true)
    GetChatMessage(chat.id, msg.id, token)
      .then(resp => setMessage(resp.data))
      .catch(e => handleAlerts(e, 'error'))
      .finally(() => setLoading(false))
  }

  return (
    <MsgContainer msgFrom={msgFrom} sameUserBelow={sameUserBelow}>
      <div className={msgFrom.type === 'system' ? styles.message_header_system : styles.message_header}>
        <MsgHeader createdDateTime={message.createdDateTime} msgFrom={msgFrom} />
        <div className={styles.message_reactions}>
          <Reactions reactions={message.reactions} chatMembers={chat.members} />
          {loading ? <Spinner className={styles.spinner} /> : null}
          <ModalReaction
            msg={message}
            me={me}
            chat={chat}
            token={token}
            handleUpdateMessage={handleUpdateMessage}
            handleAlerts={handleAlerts} />
        </div>
      </div>
      <MsgContent bodyContent={message.body.content} className={styles.message_body_content} systemMessage={msgFrom?.type === 'system'} eventDetail={msg?.eventDetail} />
    </MsgContainer>
  )
}

const MsgContainer = ({ msgFrom, children, sameUserBelow }: { msgFrom: IMsgFrom, children: any, sameUserBelow: boolean }) => (

  <div className={classNames([styles.container, {
    [styles.my_container]: msgFrom.type === 'mine',
    [styles.others_container]: msgFrom.type === 'others',
    [styles.system_container]: msgFrom.type === 'system',
  }])}>

    <div className={classNames([styles.message_container, {
      [styles.message_sameUserBelow]: !sameUserBelow,
      [styles.message_notSameUserBelow]: sameUserBelow,
      [styles.my_message_container]: msgFrom.type === 'mine',
      [styles.others_message_container]: msgFrom.type === 'others',
    }])}>
      {children}
    </div>
  </div>
)

const MsgHeader = ({ msgFrom, createdDateTime }: { msgFrom: IMsgFrom, createdDateTime: string }) => (
  <div className={styles.message_header_from_time}>
    {msgFrom?.type === 'others' ? <span className={styles.message_header_from}>{msgFrom?.from}</span> : null}
    <FriendlyDate date={DateTime.fromISO(createdDateTime)} className={styles.message_header_time} />
  </div>
)

const MsgContent = ({ bodyContent, systemMessage, className, eventDetail }: { bodyContent: any; systemMessage: boolean; eventDetail?: IMessage['eventDetail']; className?: string; }) => {
  if (systemMessage) {

    const event = summarizeEvent(eventDetail);

    return (
      <div className={styles.system_message}>
        <span>{event?.icon}</span>
        <span>{event?.message}</span>
        {event?.extraMessage}
      </div>
    )
  }

  return <div
    className={className}
    dangerouslySetInnerHTML={{ __html: String(bodyContent).replace('<img', '<img style="max-width:300px"') }} />
}

const summarizeMsgFrom = (msg: IMessage, meId: IMe['id']): IMsgFrom => {

  if (msg.messageType === 'systemEventMessage')
    return { type: 'system', from: 'system' }

  if (msg.from?.user?.id)
    if (msg.from.user.id === meId)
      return { type: 'mine', from: msg.from.user.displayName }
    else return { type: 'others', from: msg.from?.user?.displayName || '👤' }

  if (msg.from?.application?.displayName)
    return { type: 'others', from: msg.from.application.displayName }

  return { type: undefined, from: undefined };
}

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
      extraMessage: <><FcClock />{Duration.fromISO(eventDetail.callDuration).toHuman()}</>,
      icon: <FcEndCall />
    }

  if (eventDetail["@odata.type"] === "#microsoft.graph.membersAddedEventMessageDetail")
    return {
      type: 'membersAdded',
      message: 'Membro adicionado',
      icon: <FcGoodDecision />
    }

  if (eventDetail["@odata.type"] === "#microsoft.graph.membersDeletedEventMessageDetail")
    return {
      type: 'embersDeleted',
      message: `Membro removido`,
      icon: <FcDisapprove />
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
      message: 'Gravação encerrada. Salvando...',
      icon: <FcVideoCall />
    }

  if (eventDetail["@odata.type"] === "#microsoft.graph.callRecordingEventMessageDetail" && eventDetail?.callRecordingStatus === "success")
    return {
      type: 'callRecording',
      message: 'Gravação salva.',
      icon: <FcVideoFile />
    }

  if (eventDetail["@odata.type"] === "#microsoft.graph.chatRenamedEventMessageDetail")
    return {
      type: 'chatRenamed',
      message: `Chat renomeado: ${eventDetail.chatDisplayName}`,
      icon: <FcSignature />
    }

  if (eventDetail["@odata.type"] === "#microsoft.graph.teamsAppInstalledEventMessageDetail")
    return {
      type: 'teamsAppInstalled',
      message: `Aplicativo instalado`,
      icon: <FcKindle />
    }

  if (eventDetail["@odata.type"] === "#microsoft.graph.messagePinnedEventMessageDetail")
    return {
      type: 'messagePinned',
      message: `Mensagem fixada`,
      icon: <FcFlashOn />
    }

  if (eventDetail["@odata.type"] === "#microsoft.graph.messageUnpinnedEventMessageDetail")
    return {
      type: 'messageUnpinned',
      message: `Mensagem desfixada`,
      icon: <FcFlashOff />
    }

  console.groupCollapsed('Não foi possível renderizar essa mensagem de sistema:')
  console.log(eventDetail)
  console.groupEnd();
  
  return {
    type: eventDetail["@odata.type"],
    message: eventDetail["@odata.type"],
    icon: <FcMediumPriority />
  }
}