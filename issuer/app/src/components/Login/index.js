import React, { useState } from 'react'
import axios from 'axios'
import './index.css'
import { backOfficeUrl } from '../../adapters'
import poweredByIOV from '../vectors/power_by_iovlabs.svg'
import logo from '../vectors/logo.svg'

const Login = ({ login }) => {
  const [username, setUser] = useState('')
  const [password, setPass] = useState('')
  const [authError, setAuthError] = useState('')

  const auth = { username, password }

  const handleChangeUser = e => setUser(e.target.value)
  const handleChangePass = e => setPass(e.target.value)

  const authenticate = () => axios.post(backOfficeUrl + '/auth', {}, { auth })
    .then(res => {
      if (res.status === 200) login(auth)
      else setAuthError(res.data.toString())
    })
    .catch(error => setAuthError(error.message))

  return (
    <div className='login'>
      <div className='login-container'>
        <div className="container">
          <div className="row">
            <div className="col">
              <p className='login-header'>Sign in to</p>
              <h3 className='login-title'>RIF Credential manager</h3>
              <form className='form' onSubmit={e => { e.preventDefault(); authenticate() }}>
                <div className="form-group row">
                  <label htmlFor="inputEmail3" className="col-sm-3 col-form-label login-label">Username</label>
                  <div className="col-sm-6">
                    <input type="text" className="form-control login-control" id="inputEmail3" onChange={handleChangeUser} value={username} />
                  </div>
                </div>
                <div className="form-group row">
                  <label htmlFor="inputPassword3" className="col-sm-3 col-form-label login-label">Password</label>
                  <div className="col-sm-6">
                    <input type="password" className="form-control login-control" id="inputPassword3" onChange={handleChangePass} value={password} />
                  </div>
                </div>
                {
                  authError && <div className='alert alert-warning'>
                    {authError}
                  </div>
                }
                <div className="form-group row">
                  <div className="col-sm-12">
                    <div className="form-check">
                      <input className="form-check-input login-check" type="checkbox" id="gridCheck1" disabled />
                      <label className="form-check-label" htmlFor="gridCheck1">
                        Remember me
                      </label>
                    </div>
                  </div>
                </div>
                <button type='submit' className='btn btn-login'>Login</button>
              </form>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <img src={poweredByIOV} className="login-pbi-vector" alt="powered-by-iov" />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <img src={logo} className="login-rif-vector" alt="rif" />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <p className="login-cr">Copyright © 2020 IOV Labs. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
