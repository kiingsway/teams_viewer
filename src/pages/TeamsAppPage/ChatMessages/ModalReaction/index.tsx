import { useState, useEffect } from "react";
import { Modal, Button, FloatingLabel, Form } from "react-bootstrap";
import { IMessage } from "../../../../interfaces";
import { ReactMessage } from "../../../../services/graphRequests";
import emojis from '../../../../components/emojis.json';
import classNames from "classnames";
import styles from '../../TeamsAppPage.module.css';
import Input from "../../../../components/Input";


interface Props {
  msg: IMessage;
  chatId: string;
  token: string;
  handleAlerts: (msg: any, type?: "default" | "info" | "success" | "warning" | "error" | undefined, timeMs?: number | undefined) => void;
  handleUpdateMessage: (chatId: string, msgId: string) => void;
}

export default function ModalReaction({ msg, chatId, token, handleAlerts, handleUpdateMessage }: Props) {
  const [opened, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleClose = () => setOpen(false);
  const handleShow = () => setOpen(true);

  const handleReactMessage = (emojiUnicode: string) => {

    ReactMessage(chatId, msg.id, emojiUnicode, token)
      .then(() => handleUpdateMessage(chatId, msg.id))
      .catch(e => { handleAlerts(e, 'error') })
      .finally(handleClose);
  };

  useEffect(() => {
    if (!opened) return;
    console.log(msg);
  }, [opened]);

  const emojisFiltered = search ? emojis.filter(e => {
    const cat = e.categoria.toLowerCase();
    const des = e.descricao.toLowerCase();
    const id = e.id.toLowerCase();
    const uni = e.unicode.toLowerCase();
    const ser = search.toLowerCase();

    return cat.includes(ser) || des.includes(ser) || id.includes(ser) || uni.includes(ser);
  }) : emojis;

  return (
    <>
      <button
        onClick={handleShow}
        type='button'
        data-bs-toggle="modal"
        data-bs-target="#reactionModal"
        className='btn align-items-center text-white py-0 my-0'
        title='Adicionar reação'>🗯</button>

      <Modal show={opened} onHide={handleClose}>
        <Modal.Header closeButton className='bg-dark text-white' />
        <Modal.Body className='bg-dark'>
          <div className="row">

            <style jsx>{`.emoji-container {gap: 5px;}`}</style>
            <div className='d-flex flex-row align-items-center pb-3 emoji-container'>
              {msg.reactions.map(r => {
                const rEmoji = emojis.filter(e => e.id === r.reactionType)[0]?.unicode || r.reactionType || '?';
                return <span className={styles.reaction_type}>{rEmoji}</span>;
              })}
            </div>

            {msg.reactions && msg.reactions.length ? <hr /> : null}
          </div>
          <div className="row">
            <div className="col-12">
              <Input
                labelText="Pesquisar emoji"
                value={search}
                type='search'
                onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="row">
            {emojisFiltered.map(emoji => (
              <Button
                key={emoji.id}
                variant='dark'
                className={classNames(['col-2', styles.emoji_button])}
                onClick={() => handleReactMessage(emoji.unicode)}
                title={emoji.descricao}>
                {emoji.unicode}
              </Button>
            ))}
          </div>
        </Modal.Body>

        <Modal.Footer className='bg-dark'>
          <Button variant="secondary" onClick={handleClose}>Fechar</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}