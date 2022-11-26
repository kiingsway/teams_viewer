import { useState, useEffect } from "react";
import { Alert, Modal } from "react-bootstrap";
import { IChat, IMe, IMessage, IUser, THandleAlerts } from "../../../../../../interfaces";
import { GetUserById, ReactMessage, RemoveReaction } from "../../../../../../services/graphRequests";
import emojis from '../../../../../../components/emojis.json';
import classNames from "classnames";
import styles from './ModalReaction.module.css';
import { v4 as uuid } from 'uuid';
import EmojiPicker, { EmojiClickData, EmojiStyle, Theme } from "emoji-picker-react";
import Spinner from "../../../../../../components/Spinner";
import { IoMdClose } from 'react-icons/io'
import { GrFormClose } from 'react-icons/gr'

interface Props {
  me: IMe;
  msg: IMessage;
  chat: IChat;
  token: string;
  handleAlerts: THandleAlerts;
  handleUpdateMessage: (chatId: string, msgId: string) => void;
}

export default function ModalReaction({ msg, chat, token, handleAlerts, handleUpdateMessage, me }: Props) {

  const [opened, setOpen] = useState(false);

  const handleClose = () => setOpen(false);
  const handleShow = () => setOpen(true);

  async function handleReactMessage(e: EmojiClickData) {
    handleClose();
    ReactMessage(chat.id, msg.id, e.emoji, token)
      .then(() => { handleUpdateMessage(chat.id, msg.id); })
      .catch(e => handleAlerts(e, 'error'))
  }

  async function handleRemoveReaction(emoji: string) {
    handleClose();
    RemoveReaction(chat.id, msg.id, emoji, token)
      .then(() => handleUpdateMessage(chat.id, msg.id))
      .catch(e => handleAlerts(e, 'error'))
  };

  const msgReactions = msg.reactions.sort((a, b) => a.user.user?.id === me.id ? -1 : 1)

  return (
    <>
      <button
        onClick={handleShow}
        type='button'
        data-bs-toggle="modal"
        data-bs-target="#reactionModal"
        className={styles.btn_reaction}
        title='Reagir à mensagem'>🗯</button>

      <Modal show={opened} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton className={styles.modal_header}>

        </Modal.Header>
        <div className={styles.modal_container}>
          <div className="row">
            <div className="col-12 col-md-8">
              <div className={styles.emoji_picker}>
                <EmojiPicker
                  emojiStyle={"native" as EmojiStyle}
                  theme={"dark" as Theme}
                  width='100%'
                  skinTonesDisabled={true}
                  onEmojiClick={e => handleReactMessage(e)}
                />
              </div>
            </div>
            <div className="col-12 col-md-4">

              <div className={classNames([styles.message_reactions_list, styles.blue_scroll])}>
                {msgReactions.map(r => {
                  const rEmoji = emojis.filter(e => e.id === r.reactionType)[0]?.unicode || r.reactionType || '?';
                  const reactedBy = chat.members.filter(member => member.userId === r.user.user.id)[0];
                  const reactedByMe = reactedBy.userId === me.id;
                  return (
                    <div className={styles.message_reaction}
                      key={`${r.reactionType}${r.user.user.id}`}>
                      <span title={reactedBy.displayName} className={styles.item_reaction}>{rEmoji} {reactedBy.displayName}</span>
                      {reactedByMe ?
                        <button
                          title="Remover reação"
                          className={styles.remove_reaction}
                          onClick={() => handleRemoveReaction(rEmoji)}>
                          <IoMdClose />
                        </button> : null
                      }
                    </div>
                  )
                  // return <MessageReaction key={uuid()} emoji={rEmoji} userId={r.user.user.id} token={token} handleAlerts={handleAlerts} />
                })}

              </div>
            </div>
          </div>
        </div>
        <Modal.Footer className={styles.modal_footer}>

          <span className={styles.modal_info}>
            Alguns emojis não são suportados pelo Teams

          </span>

        </Modal.Footer>
      </Modal>
    </>
  )
}

interface IMessageReaction {
  emoji: string;
  userId: string;
  token: string;
  handleAlerts: THandleAlerts;
}

const MessageReaction = ({ emoji, userId, token, handleAlerts }: IMessageReaction) => {
  const [user, setUser] = useState<IUser>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true)
    GetUserById(userId, token)
      .then(resp => setUser(resp.data))
      .catch(e => handleAlerts(e, 'error'))
      .finally(() => setLoading(false));

  }, []);

  return (
    <div className={classNames([styles.emoji_card, 'col-2 emoji'])}>
      <span className={classNames([styles.emoji_card_emoji, 'emoji'])}>{emoji}</span>
      <span className={styles.emoji_card_user}>{loading ? <Spinner /> : user?.displayName}</span>
    </div>
  )
}