import React from 'react';
import { IChat, IReaction } from '../../../../../../interfaces';
import emojis from '../../../../../../components/emojis.json';
import styles from './Reactions.module.css';

interface Props {
  reactions: IReaction[];
  chatMembers: IChat['members'];
}

export default function Reactions({ reactions, chatMembers }: Props) {

  if (!reactions || !reactions.length) return null;

  return (
    <div className={styles.message_header_reaction}>
      {reactions.map(r => {
        const emojiReaction = emojis.filter(e => e.id === r.reactionType)[0]?.unicode || r.reactionType || '?';
        return (
          <span
            key={`${r.reactionType}${r.user.user.id}`}
            className='emoji'>
            {emojiReaction}
          </span>
        )
      })}
    </div>
  )
}
