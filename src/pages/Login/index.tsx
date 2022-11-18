import { Label, Input } from '@fluentui/react-components';
import { Card } from '@fluentui/react-components/unstable';
import React from 'react';
import styles from './Login.module.scss';

interface Props {
  token: string;
  setToken: React.Dispatch<React.SetStateAction<string>>;
}

export default function Login({ token, setToken }: Props) {
  return (
    <Card className={styles.login_card}>
      <Label htmlFor="input67">
        Sample input
      </Label>
      <Input
        value={token}
        onChange={e => setToken(e.target.value)}
        id="input67"
      />
    </Card>
  )
}