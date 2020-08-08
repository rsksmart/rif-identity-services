import React from 'react'
import './index.css'
import poweredByIOV from '../vectors/power_by_iovlabs.svg'
import logo from '../vectors/logo.svg'

const Login = ({ login }) => (
  <div className='login'>
    <div className='login-container'>
      <div className="container">
        <div className="row">
          <div className="col">
            <p className='login-header'>Sign in to</p>
            <h3 className='login-title'>RIF Credential manager</h3>
            <form className='form' onSubmit={e => { e.preventDefault(); login() }}>
              <div className="form-group row">
                <label for="inputEmail3" className="col-sm-3 col-form-label login-label">Email</label>
                <div className="col-sm-6">
                  <input type="email" className="form-control login-control" id="inputEmail3" />
                </div>
              </div>
              <div className="form-group row">
                <label for="inputPassword3" className="col-sm-3 col-form-label login-label">Password</label>
                <div className="col-sm-6">
                  <input type="password" className="form-control login-control" id="inputPassword3" />
                </div>
              </div>
              <div class="form-group row">
                <div class="col-sm-12">
                  <div class="form-check">
                    <input class="form-check-input login-check" type="checkbox" id="gridCheck1" />
                    <label class="form-check-label" for="gridCheck1">
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
            <img src={poweredByIOV} className="login-pbi-vector" />
          </div>
        </div>
        <div className="row">
          <div className="col">
            <img src={logo} className="login-rif-vector" />
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

export default Login
