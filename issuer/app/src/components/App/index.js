import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './index.css'
import Login from '../Login'
import Requests from '../Requests'
import { backOfficeUrl } from '../../adapters'

function App() {
  const [isLoggedIn, setLogin] = useState('')
  const [identity, setIdentity] = useState('')

  useEffect(() => {
    if (isLoggedIn) {
      getIdentity()
    }
  }, [isLoggedIn])

  const login = () => {
    setLogin('login')
  }

  if (!isLoggedIn) {
    return <Login login={login} />
  }

  const getIdentity = () => axios.get(backOfficeUrl + '/identity').then(res => res.data).then(setIdentity)

  return (
    <>
      <nav class="navbar navbar-light navbar app-navbar">
        <span class="navbar-brand">
          RIF Identity
        </span>
        <span class="navbar-brand">
          <div className="did-container">
            {identity.slice(0, 30) + '...' + identity.slice(-4)}
          </div>
        </span>
      </nav>
    <Requests />
    <footer className="footer"></footer>
    </>
  )
}

export default App
