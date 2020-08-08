import React, { useState } from 'react'
import Login from './Login'
import Requests from './Requests'

function App() {
  const [isLoggedIn, setLogin] = useState('')


  const login = () => {
    setLogin('login')
  }

  if (!isLoggedIn) {
    return <Login login={login} />
  }

  return <Requests />
}

export default App
