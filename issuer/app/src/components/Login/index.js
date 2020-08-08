import React from 'react'
import './index.css'

const Login = ({ login }) => (
  <div className='Login'>
    <button onClick={login} className='Login-button'>Login</button>
  </div>
)

export default Login
