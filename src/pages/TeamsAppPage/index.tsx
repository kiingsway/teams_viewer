import classNames from 'classnames';
import React, { useState } from 'react'
import { IChat, IChatMessages, IMe, IMessage, IToken, THandleAlerts } from '../../interfaces';
import { GetChatMessages } from '../../services/graphRequests';
import ChatList from './ChatList';
import ChatMessages from './ChatMessages';
import Header from './Header';
import styles from './TeamsAppPage.module.css';

interface Props {
  me: IMe;
  token: string;
  handleLogout: () => void;
  handleAlerts: THandleAlerts;
}

export default function TeamsAppPage({ me, token, handleLogout, handleAlerts }: Props) {

  const [loading, setLoading] = useState(false);
  const [selectedChat, selectChat] = useState<IChatMessages>();

  function handleChangeChat(chat: IChat) {
    setLoading(true);
    GetChatMessages(chat.id, token)
      .then(chatMessagesData => {
        const cm = chatMessagesData.data;
        selectChat({
          chat: chat,
          messages: cm.value.sort(byCreatedDateTime),
          nextLink: cm["@odata.nextLink"],
        });
      })
      .catch(e => handleAlerts(e, 'error'))
      .finally(() => setLoading(false))
  }

  return (
    <div className='container-fluid'>
      <Header me={me} handleLogout={handleLogout} tokenExp={GetJwt(token)?.expires} />

      <div className={classNames(['row', styles.row_chat])}>
        <div className={`col-3 p-2 ${styles.chat_list_screen} ${styles.blue_scroll}`}>
          <ChatList
            me={me}
            token={token}
            loadingMessages={loading}
            selectedChat={selectedChat}
            handleAlerts={handleAlerts}
            handleChangeChat={handleChangeChat}
          />
        </div>
        <div className={`col-9 ${styles.chat_row_messages} ${styles.blue_scroll}`}>
          {selectedChat && !loading ?
            <ChatMessages
              me={me}
              token={token}
              selectedChat={selectedChat}
              handleAlerts={handleAlerts} /> : null}
          {loading ? <div className='p-4 m-4 text-muted'>Carregando mensagens...</div> : null}
          {!selectedChat && !loading ? <div className='p-4 m-4 text-muted'>Selecione um chat ao lado para mostrar as mensagens...</div> : null}

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

export const byCreatedDateTime = (a: IMessage, b: IMessage) =>
  a.createdDateTime < b.createdDateTime ? 1 : (a.createdDateTime > b.createdDateTime ? -1 : 0)