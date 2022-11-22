import React, { Dispatch, SetStateAction, useState } from 'react'
import { Button, Modal } from 'react-bootstrap';
import Input from '../../components/Input';

interface Props {
  token: string;
  loading: boolean;
  handleLogin: () => void;
  handleAlerts: (msg: any, type?: 'default' | 'info' | 'success' | 'warning' | 'error', timeMs?: number) => void;
  setToken: Dispatch<SetStateAction<string>>;
}

export default function LoginPage({ token, setToken, handleLogin, loading }: Props) {

  return (
    <div className="card bg-dark p-4 shadow">
      <Input
        type='search'
        id='txtToken'
        value={token}
        onChange={e => setToken(e.target.value)}
        labelText='Insira o token de acesso'
      />
      
      <span className='mb-4'>
        Obtenha o token de acesso no site do <a target="__blank" href="https://developer.microsoft.com/pt-br/graph/graph-explorer">Graph Explorer</a>.
      </span>

      <button
        className='btn btn-outline-primary'
        onClick={handleLogin}
        disabled={loading || !token}>
        {loading ? 'Carregando...' : 'Login'}
      </button>

    </div>
  )
}