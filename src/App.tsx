import React, { useEffect, useState } from 'react';
import './App.css';
import { getChatMessages, getChats, getMe, getViaToken } from './services/requests';

import { AiOutlineUserAdd } from 'react-icons/ai'
import { BsExclamationLg } from 'react-icons/bs'
import { BiQuestionMark, BiPhoneCall, BiUpArrow, BiDownArrow } from 'react-icons/bi'
import { FaBell } from 'react-icons/fa'
import { HiUserGroup, HiUser } from 'react-icons/hi'
import styles from './App.module.scss';
import { IMe, IChat, } from './interfaces';
import { DateTime, Settings as LuxonSettings } from 'luxon'
import classNames from 'classnames'
import moment from 'moment'
import 'moment/locale/pt-br'
import { MenuItem, MenuList, Caption1, Tab, TabList, Input, Title3, Divider } from '@fluentui/react-components'
import { Card } from '@fluentui/react-components/unstable';


moment.locale('pt-br')
LuxonSettings.defaultLocale = "pt-BR";

const loadingsDefault = {
  gettingChats: false,
  gettingMessages: false

}

export default function App() {

  const [search, setSearch] = useState<string>('');
  const [chats, setChats] = useState<IChat[]>([]);
  const [me, setMe] = useState<IMe>();
  const [selectedChat, selectChat] = useState<IChat>();
  const [chatsNextLink, setChatsNextLink] = useState<string>("");

  useEffect(() => {
    getMe()
      .catch(e => alert(e))
      .then(meData => {
        setMe(meData?.data);
        updateAll();
      })

  }, [])

  const updateAll = () => {
    setChats([])

    getChats()
      .catch(e => alert(e))
      .then(chatsData => {
        setChatsNextLink(chatsData?.data['@odata.nextLink'] || '');
        handleAddChats(chatsData?.data.value)
      })

  }

  const handleAddChats = (chats: IChat[]) => {

    const newChats = chats.map(chat => {

      let topic = chat.topic;

      const membersWithoutMe = chat.members.filter(member => member.userId !== me?.id)

      if (chat.chatType === 'oneOnOne' && chat.members.length) {

        topic = membersWithoutMe
          .map(member => member.displayName)
          .join(', ')

      } else if (chat.chatType === 'group' && !chat.topic) {

        topic = membersWithoutMe
          .map(member => member.displayName.split(' ')[0])
          .join(', ')
      }

      return { ...chat, topic }

    });

    const aaa = newChats.map(chat => `${chat.id} | ${chat.topic}`).join('\n')
    // console.log(aaa)

    setChats(prevChats => prevChats?.length ? [...prevChats, ...newChats] : newChats)

  }

  useEffect(() => {
    console.log(selectedChat)
    if (selectedChat && !selectedChat?.messages) {

      getChatMessages(selectedChat.id)
        .then(chatData => {
          selectChat((prev: any) =>
            ({ ...prev, messages: chatData.data.value, getNextMessages: chatData.data['@odata.nextLink'] })
          )
        })
    }

  }, [selectedChat])

  // Caso tiver nextlink de chat, obtém mais chats e adiciona nos chats totais.
  const handleGetMoreChat = () => chatsNextLink && getViaToken(chatsNextLink).then(olderChatsData => handleAddChats(olderChatsData.data.value))

  // Caso o chat selecionado tenha nextlink para próximas mensagens, obtém esse link e adiciona as mensagens totais.
  const handleGetMoreMessages = () => selectedChat?.getNextMessages &&
    getViaToken(selectedChat?.getNextMessages as string).then(olderMessages => {
      selectChat((prev: any) =>
      ({
        ...prev,
        messages: [...prev.messages, ...olderMessages.data.value],
        getNextMessages: olderMessages.data['@odata.nextLink']
      }))
    })


  const filteredChats = search ? chats?.filter(c => (c?.topic || '').toLowerCase().includes(search.toLowerCase())) : chats;

  return (

    <Card className={styles.container}>

      <div className={styles.chat_list}>
        {/* TÓPICO */}
        <p className={styles.chat_list_topic}>Chats</p>

        {/* SEARCH */}
        <div className='ps-3 pt-2 w-100'>
          <Input
            appearance="filled-darker"
            placeholder='Pesquisar...'
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>


        <div className={styles.chat_list_items}>
          <MenuList>
            {(filteredChats || []).map(chat => (
              <MenuItem
                className={selectedChat?.id === chat.id ? styles.chat_selected : ''}
                value={chat.id}
                onClick={e => selectChat(chats?.filter(chatList => chatList.id === chat.id)[0])}
              >
                <span title={chat.topic}>
                  {chat.chatType === 'group' ?
                    <HiUserGroup className={styles.chat_list_items_item_icon} /> :
                    <HiUser className={styles.chat_list_items_item_icon} />}
                  {chat.topic}
                </span>
              </MenuItem>
            ))}
          </MenuList>
        </div>

        {/* LISTA DE CHATS */}
        {/* <div className={styles.chat_list_items}>
          <TabList
            onClick={e => console.log((e.target as any).value)}
            onTabSelect={e => {
              // console.log((e.target as any).value)
              selectChat(chats?.filter(chat => chat.id === (e.target as HTMLTextAreaElement).value)[0])
            }}
            defaultSelectedValue={selectedChat?.id}
            selectedValue={selectedChat?.id}
            vertical>

            {(filteredChats || []).map(chat => {

              return (
                <Tab
                  key={chat.id}
                  value={chat.id}
                >
                  <span title={chat.topic}>

                    {chat.chatType === 'group' ?
                      <HiUserGroup className={styles.chat_list_items_item_icon} /> :
                      <HiUser className={styles.chat_list_items_item_icon} />}
                    {chat.topic}
                  </span>
                </Tab>
              )
            }
            )}

          </TabList>
        </div> */}

      </div>

      {/* MESSAGES SCREEN */}
      <div className={styles.chat_messages}>

        {selectedChat && <ChatScreen
          handleGetMoreMessages={handleGetMoreMessages}
          selectedChat={selectedChat}
          me={me} />}

      </div>

    </Card >

  )
}

const ChatScreen = (pr: { selectedChat?: IChat, handleGetMoreMessages: () => any, me?: IMe }) => {

  const membersWithoutMe = pr.selectedChat ? (pr.selectedChat?.members?.length > 1 ?
    pr.selectedChat.members.filter((member: any) => member.userId !== pr.me?.id)
    : pr.selectedChat.members) : []

  type IReactionTypes = 'like' | 'heart' | 'laugh' | 'surprised' | 'sad' | 'angry';
  const Reaction = (pr: { reactionType: IReactionTypes }) => {

    const chatReactions = {
      like: { title: 'Curtir', emoji: '👍' },
      heart: { title: 'Coração', emoji: '💓' },
      laugh: { title: 'Gargalhada', emoji: '😂' },
      surprised: { title: 'Surpreso', emoji: '😮' },
      sad: { title: 'Triste', emoji: '🙁' },
      angry: { title: 'Brabei', emoji: '😡' },
    }

    return <span className='chat_reactions' title={chatReactions[pr.reactionType].title}>{chatReactions[pr.reactionType].emoji}</span>
  }

  const MyUserMessage = () => {

    return (
      <>
      </>
    )

  }
  const SomeUserMessage = () => {

    return (
      <>
      </>
    )

  }
  const SystemMessage = () => {

    return (
      <>
      </>
    )

  }

  return pr.selectedChat ? (
    <Card className={styles.chat_messages_screen}>
      <Title3 block className={styles.chat_messages_topic}>{pr.selectedChat.topic}</Title3>
      {pr.selectedChat?.chatType === 'group' &&
        <Caption1 block className={styles.chat_messages_members}>
          {membersWithoutMe.map((member: any) => member.displayName).join(', ')}
        </Caption1>
      }
      <Divider />

      {pr.selectedChat?.messages?.map(msg => {
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
                            {(msg?.eventDetail?.callParticipants || [])
                              .map((part: any) => part.participant?.user?.displayName)
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
                          {msg.reactions?.map(reaction => <Reaction key={reaction.user.user.id} reactionType={reaction.reactionType} />)}
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

    </Card>
  ) : null


  return (
    <div className='d-flex flex-column'>
      <h2 className='chat_topic'>{pr.selectedChat?.topic}</h2>
      {pr.selectedChat?.chatType === 'group' &&
        <div className='chat_group_members'>
          <span className='p-0 text-muted'>
            {membersWithoutMe.map((member: any) => member.displayName).join(', ')}
          </span>
        </div>}
      <div
        className='border border-1 rounded mt-1 d-flex flex-column-reverse chat_messages'
      >


        {pr.selectedChat?.messages?.map(msg => {
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
                              {(msg?.eventDetail?.callParticipants || [])
                                .map((part: any) => part.participant?.user?.displayName)
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
                            {msg.reactions?.map(reaction => <Reaction key={reaction.user.user.id} reactionType={reaction.reactionType} />)}
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
          pr.selectedChat?.getNextMessages &&
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

interface ChatsProps {
  chatsNextLink: string
  handleGetMoreChat: () => void
  contacts: IChat[]
  selectChat: React.Dispatch<React.SetStateAction<IChat | undefined>>
}

const Chats = (pr: ChatsProps) => {

  return (
    <MenuList>
      {pr.contacts.map(chat => (
        <MenuItem
          onClick={() => pr.selectChat(chat)}
          title={chat.topic}
        >
          {chat.chatType === 'group' ? <HiUserGroup className='topicIcon' /> : <HiUser className='topicIcon' />}
          {chat.topic}
        </MenuItem>

      ))}
    </MenuList>
  )

  const SelectChatButton = (prr: { chat: IChat }) => (
    <div
      key={prr.chat.id}
      className='border border-1 rounded m-1 contactItem px-2 py-1 d-flex flex-row align-items-center'
      onClick={() => pr.selectChat(prr.chat)}>

      <div>{prr.chat.chatType === 'group' ? <HiUserGroup className='topicIcon' /> : <HiUser className='topicIcon' />}</div>

      <span className='topicText' title={prr.chat.topic}>{prr.chat.topic}</span>

    </div>
  )

  const MoreChatButton = () => (
    <div
      className={classNames(
        'border border-1 rounded m-1',
        'contactItem px-2 py-1 d-flex',
        'flex-row align-items-center',
        'text-center justify-content-between',
        styles.magic_btn,
        styles.magic
      )}
      onClick={pr.handleGetMoreChat}
    >
      <BiDownArrow />Obter mais chats...<BiDownArrow />

    </div>
  )



  return (
    <div className='px-2 p-2 contactsList'>

      {pr.contacts.map(chat => <SelectChatButton key={chat.id} chat={chat} />)}

      {pr.chatsNextLink && <MoreChatButton />}

    </div>
  )
}