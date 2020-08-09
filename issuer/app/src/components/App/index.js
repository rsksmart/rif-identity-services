import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './index.css'
import Login from '../Login'
import Requests from '../Requests'
import { backOfficeUrl } from '../../adapters'
import { transformDID } from '../../transformers'

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
            {transformDID(identity)}
          </div>
        </span>
      </nav>
      <div className="container">
        <div className="row menu">
          <div className="col"><label className="menu-item menu-item-disabled">Home</label></div>
          <div className="col"><label className="menu-item menu-item-disabled">Issue</label></div>
          <div className="col"><label className="menu-item menu-item-selected">Issue credentials</label></div>
          <div className="col"><label className="menu-item menu-item-disabled">History</label></div>
          <div className="col"><label className="menu-item menu-item-disabled">Settings</label></div>
        </div>
        <div className="row">
          <div className="col">
            <Requests />
          </div>
        </div>
      </div>
    </>
  )
}

export default App
