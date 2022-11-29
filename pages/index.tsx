import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { useState } from 'react';
import { GetMyInfo } from '../src/services/graphRequests';
import { IMe } from '../src/interfaces';
import { toast, ToastContainer, ToastOptions } from 'react-toastify';
import LoginPage from '../src/pages/LoginPage';
import TeamsAppPage from '../src/pages/TeamsAppPage';
import 'react-toastify/dist/ReactToastify.css';

export default function Home() {

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<IMe>();

  const handleAlerts = (msg: any, type: 'default' | 'info' | 'success' | 'warning' | 'error' = 'default', timeMs: number = 10000) => {

    console.error(msg);

    let message = String(msg);
    if (msg?.response?.data?.error) message = `(${msg.response.data.error.code}) ${msg.response.data.error.message}`;

    const toastBody: ToastOptions = {
      position: "top-center",
      autoClose: timeMs,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    }

    if (type === 'info') toast.info(message, toastBody);
    if (type === 'success') toast.success(message, toastBody);
    if (type === 'warning') toast.warning(message, toastBody);
    if (type === 'error') toast.error(message, toastBody);
    if (type === 'default') toast(message, toastBody);
  }

  const handleLogin = () => {
    if (!token) return
    setLoading(true)
    GetMyInfo(token)
      .then(resp => setMe(resp.data))
      .catch(e => handleAlerts(e, 'error'))
      .finally(() => setLoading(false))
  }

  const handleLogout = () => window.confirm('Tem certeza que deseja sair?') ? setMe(undefined) : null;

  return (
    <div>

      <Head>
        <title>Teams Quick Viewer</title>
        <meta name="description" content="Teams Quick Viewer - Teams 2" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ToastContainer
        position="top-center"
        className={styles.emoji}
        theme="colored"
        newestOnTop pauseOnFocusLoss
        closeOnClick draggable
        pauseOnHover rtl={false}
        hideProgressBar={false}
        autoClose={2500}
      />

      <main className={styles.main}>

        {!me ?
          <LoginPage
            token={token}
            loading={loading}
            handleLogin={handleLogin}
            handleAlerts={handleAlerts}
            setToken={setToken} />
          :
          <TeamsAppPage
            handleLogout={handleLogout}
            handleAlerts={handleAlerts}
            token={token}
            me={me} />}

      </main>
    </div>
  )
}