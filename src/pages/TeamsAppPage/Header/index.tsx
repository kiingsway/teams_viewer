import classNames from 'classnames';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react'
import { HiOutlineLogout } from 'react-icons/hi';
import { IMe } from '../../../interfaces';
import styles from '../TeamsAppPage.module.css';

interface Props {
  me: IMe;
  tokenExp?: string;
  handleLogout: () => void;
}

export default function Header({ me, handleLogout, tokenExp }: Props) {

  const expirationDate = DateTime.fromMillis(parseInt(String(tokenExp)) * 1000);
  const [tokenTimeLeft, setTokenTimeLeft] = useState(expirationDate.diffNow().toFormat('hh:mm:ss'));

  useEffect(() => {
    const timer = setInterval(() => setTokenTimeLeft(expirationDate.diffNow().toFormat('hh:mm:ss')), 1000);
    if (expirationDate.diffNow().valueOf() < 0) { setTokenTimeLeft('Token expirado!'); return; }
    return () => clearInterval(timer);
  }, [tokenTimeLeft]);

  return (
    <div className={classNames(["row", styles.row_header])}>
      <div className='col-12 d-flex align-items-center justify-content-end'>
        <div className='d-flex flex-row align-items-center user-info'>
          <span className='text-muted' title='Tempo de expiração do token. Após a expiração, saia da conta e obtenha um novo token no Microsoft Graph'>{tokenTimeLeft}</span>
          <div className='d-flex flex-column align-items-end mx-3'>
            <span>{me.displayName}</span>
            <span className='text-muted'>{me.userPrincipalName}</span>
          </div>
          <button
            onClick={handleLogout}
            title='Sair da conta'
            className='btn btn-outline-danger d-flex align-items-center'>
            <HiOutlineLogout />
          </button>
        </div>
      </div>
    </div>
  )
}
