import React from 'react'
import { IMe } from '../../interfaces';

interface Props {
  token: string;
  me: IMe;
  handleLogout: () => void;
}

export default function ChatApp({ token, me, handleLogout }: Props) {
  return (
    <div>ChatApp</div>
  )
}
