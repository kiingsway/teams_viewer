import classNames from 'classnames';
import React from 'react';
import styles from './Spinner.module.css';

interface Props {
  className?: string;
}

export default function Spinner({ className }: Props) {
  return (
    <span className={classNames([styles.loader, className])} />
  )
}
