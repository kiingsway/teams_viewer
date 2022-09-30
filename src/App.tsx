import React, { useEffect, useState } from 'react';
import './App.css';
import { MDBContainer } from 'mdb-react-ui-kit'
import { getChatMessages, getChats, getMe, getViaToken } from './services/requests';

import { GrUpdate } from 'react-icons/gr'
import { AiOutlineUserAdd } from 'react-icons/ai'
import { BsExclamationLg } from 'react-icons/bs'
import { BiQuestionMark, BiPhoneCall, BiUpArrow, BiDownArrow, BiRevision } from 'react-icons/bi'
import { FaBell } from 'react-icons/fa'
import { HiUserGroup, HiUser } from 'react-icons/hi'
import styles from './App.module.scss';
import { IMe, IChat, } from './interfaces';
import { DateTime, Settings as LuxonSettings } from 'luxon'
import classNames from 'classnames'
import moment from 'moment'
import 'moment/locale/pt-br'
moment.locale('pt-br')
LuxonSettings.defaultLocale = "pt-BR";

const loadingsDefault = {
  gettingChats: false,
  gettingMessages: false

}

export default function App() {

  const [search, setSearch] = useState<string>("");
  const [chats, setChats] = useState<IChat[]>();
  const [me, setMe] = useState<IMe>();
  const [selectedChat, selectChat] = useState<IChat>();
  const [chatsNextLink, setChatsNextLink] = useState<string>("");
  // const [loads, setLoads] = useState(loadingsDefault);

  useEffect(() => console.log(selectedChat), [selectedChat])

  const handleAddChats = (chats: IChat[]) => {

    const newChats = chats.map(chat => {

      let topic: string = chat.topic;

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

      return {
        ...chat,
        topic
      }

    });

    setChats(prevChats => prevChats?.length ? [...prevChats, ...newChats] : newChats)

  }

  const updateAll = () => {
    setChats([])

    getChats()
      .catch(e => alert(e))
      .then(chatsData => {
        setChatsNextLink(chatsData?.data['@odata.nextLink'] || '');
        handleAddChats(chatsData?.data.value)
      })

  }


  useEffect(() => {
    getMe()
      .catch(e => alert(e))
      .then(meData => setMe(meData?.data))
    updateAll();
  }, [])

  useEffect(() => {
    if (selectedChat && !selectedChat?.messages) {

      getChatMessages(selectedChat.id)
        .then(chatData => {
          selectChat((prev: any) =>
            ({ ...prev, messages: chatData.data.value, getNextMessages: chatData.data['@odata.nextLink'] })
          )
        }
        )
    }

  }, [selectedChat])

  const handleGetMoreChat = () => {

    if (chatsNextLink) {
      getViaToken(chatsNextLink)
        .then(olderChatsData =>
          handleAddChats(olderChatsData?.data.value)
        )
    }
  }

  const handleGetMoreMessages = () => {
    if (selectedChat?.getNextMessages)
      getViaToken(selectedChat?.getNextMessages as string).then(olderMessages => {
        selectChat((prev: any) =>
        ({
          ...prev,
          messages: [...prev.messages, ...olderMessages.data.value],
          getNextMessages: olderMessages.data['@odata.nextLink']
        }))
      })
  }

  const filteredChats = search ? chats?.filter(c => (c?.topic || '').toLowerCase().includes(search.toLowerCase())) : chats;

  return (
    <MDBContainer className='m-1 d-flex border border-1 p-1 mx-auto rounded app'>
      <div className='bg-dark w-25'>
        <div className='d-flex flex-column pb-2'>
          <div className="d-flex flex-row align-items-center">
            <h1 className='contactsTitle'>Chats</h1>
            <button className='glow-on-hover' onClick={updateAll}>
              <BiRevision className='text-light' />
            </button>
          </div>
          <div className='ps-3 pt-2'>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              type="text" placeholder='Pesquisar' className='bg-dark text-light border border-1 rounded searchText' />

          </div>

        </div>

        <Chats
          chatsNextLink={chatsNextLink}
          handleGetMoreChat={handleGetMoreChat}
          contacts={filteredChats}
          selectChat={selectChat}
          me={me}
        />

      </div>
      <div className='bg-dark w-75 p-3'>
        {
          selectedChat ? <ChatScreen handleGetMoreMessages={handleGetMoreMessages} selectedChat={selectedChat} me={me} /> : null
        }
      </div>
    </MDBContainer>
  );
}

const ChatScreen = (pr: { selectedChat: IChat, handleGetMoreMessages: any, me?: IMe }) => {

  const selectedChat: IChat = pr.selectedChat;

  const membersWithoutMe = selectedChat.members.length > 1 ?
    selectedChat.members.filter((member: any) => member.userId !== pr.me?.id)
    : selectedChat.members


  const Reaction = (pr: { reaction: any }) => {

    let reactionIcon: JSX.Element | string;

    switch (pr.reaction.reactionType) {
      case 'like':
        reactionIcon = <span title='Curtir'>👍</span>
        break;
      case 'heart':
        reactionIcon = <span title='Coração'>💓</span>
        break;
      case 'laugh':
        reactionIcon = <span title='Gargalhada'>😂</span>
        break;
      case 'surprised':
        reactionIcon = <span title='Surpreso'>😮</span>
        break;
      case 'sad':
        reactionIcon = <span title='Triste'>🙁</span>
        break;
      case 'angry':
        reactionIcon = <span title='Brabei'>😡</span>
        break;
      default:
        reactionIcon = <BiQuestionMark />
        break;
    }

    return <span className='chat_reactions'>{reactionIcon}</span>
  }


  return (
    <div className='d-flex flex-column'>
      <h2 className='chat_topic'>{selectedChat.topic}</h2>
      {
        selectedChat.chatType === 'group' ?
          <div className='chat_group_members'>
            <span className='p-0 text-muted'>
              {membersWithoutMe.map((member: any) => member.displayName).join(', ')}
            </span>
          </div>
          : null
      }
      <div
        className='border border-1 rounded mt-1 d-flex flex-column-reverse chat_messages'
      >


        {selectedChat.messages?.map(msg => {
          const myMsg = msg.from?.user?.id === pr.me?.id;
          const style: React.CSSProperties = { marginLeft: myMsg ? 'auto' : '' }

          const now = DateTime.now();
          const sentMsg = DateTime.fromISO(msg.createdDateTime);
          const formatDate = sentMsg.hasSame(now, 'day') ?
            'HH:mm'
            : (sentMsg.hasSame(now, 'week') ? 'cccc HH:mm'
              : (sentMsg.hasSame(now, 'year') ? 'dd LLL HH:mm'
                : 'dd LLL yy HH:mm'))

          const isSystemMessage = msg.messageType === "systemEventMessage";
          const isUrgent = msg.importance === 'urgent';
          const isImportant = msg.importance === 'high';

          return (
            <div className='w-75 message_container' style={style}>
              <div
                className={classNames(
                  'message',
                  { 'border-start border-danger': isImportant },
                  { 'border border-1 border-danger': isUrgent },
                  { 'myMessage justify-content-end': myMsg },
                  { 'notMyMessage justify-content-start': !myMsg && !isSystemMessage },
                  { 'systemMessage justify-content-start': !myMsg && isSystemMessage }
                )}>
                <div>
                  {
                    isSystemMessage ?
                      <>
                        <span className='chat_sender'>
                          {DateTime.fromISO(msg.createdDateTime).toFormat(formatDate)}
                        </span>

                        <div className="d-flex flex-row align-items-center">
                          <div className='me-2'>
                            {msg.eventDetail.callEventType === 'call' ?
                              <BiPhoneCall className='icon' />
                              : (msg.eventDetail['@odata.type'] === "#microsoft.graph.membersAddedEventMessageDetail" ?
                                <AiOutlineUserAdd className='icon' />
                                : <BiQuestionMark className='icon' />)}
                          </div>
                          <div className='d-flex flex-column chat_sender'>
                            <span className='pb-1'>
                              {(msg.eventDetail?.callParticipants || [])
                                .map((part: any) => part.participant.user.displayName)
                                .join(', ')
                              }
                            </span>
                            <span>
                              {msg.eventDetail.callDuration && moment.duration(msg.eventDetail.callDuration).humanize()}
                            </span>
                          </div>
                        </div>
                      </> :
                      <>
                        <span className='chat_sender'>
                          {!myMsg && <>{msg.from?.user?.displayName} • </>}
                          {DateTime.fromISO(msg.createdDateTime).toFormat(formatDate)}
                          {isUrgent && <> • <FaBell className='icon text-danger' /></>}
                          {isImportant && <> • <BsExclamationLg className='icon text-danger' /></>}
                          <div className="d-block">
                            {msg.reactions?.map(reaction => <Reaction reaction={reaction} />)}
                          </div>
                        </span>
                        <div className='pt-1' dangerouslySetInnerHTML={{ __html: msg.body.content }} />
                      </>
                  }
                </div>
              </div>
            </div>
          )
        }
        )}
        {
          pr.selectedChat.getNextMessages &&
          <button
            onClick={pr.handleGetMoreMessages}
            className={classNames(styles.magic_btn, styles.magic)}
          >
            <BiUpArrow className='me-4' />
            Obter mais mensagens...
            <BiUpArrow className='ms-4' />
          </button>
        }
      </div>
    </div >
  )

}

const Chats = (pr: any) => {

  return (
    <div className='px-2 p-2 contactsList'>
      {
        pr.contacts?.map((chat: any) => (
          <div
            key={chat.id}
            className='border border-1 rounded m-1 contactItem px-2 py-1 d-flex flex-row align-items-center'
            onClick={() => pr.selectChat(chat)}
          >
            <div>
              {
                chat.chatType === 'group' ? <HiUserGroup className='topicIcon' /> : <HiUser className='topicIcon' />
              }
            </div>
            <span className='topicText' title={chat.topic}>
              {chat.topic}
            </span>

          </div>
        )
        )
      }
      {
        pr.chatsNextLink ?
          <div
            className={classNames(
              'border border-1 rounded m-1 contactItem px-2 py-1 d-flex flex-row align-items-center text-center justify-content-between',
              styles.magic_btn,
              styles.magic
            )}
            onClick={pr.handleGetMoreChat}
          >
            <BiDownArrow />
            Obter mais chats...
            <BiDownArrow />

          </div> : null
      }
    </div>
  )
}