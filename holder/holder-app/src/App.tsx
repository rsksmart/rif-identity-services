import React, { useState, useEffect } from 'react';
import { ActionSendDIDComm } from 'daf-did-comm'
import { agent } from './setup'

type Request = { sdrJwt: string, message: string }

function App() {
  const [error, setError] = useState('')
  const [identity, setIdentity] = useState('')
  const [requestJwt, setRequestJwt] = useState('')

  const handleCatch = (error: Error) => { setError(error.message); console.error(error); return error }

  useEffect(() => {
    agent.identityManager.getIdentities()
      .then((identities) => {
        if (identities.length) setIdentity(identities[0].did)
      })
      .catch(handleCatch)
  }, [])

  const createIdentity = () => agent.identityManager.createIdentity()
    .then(({ did }) => setIdentity(did))
    .catch(handleCatch)

  const requestCredential = async () => {
    const sdrData = {
      issuer: identity,
      claims: [
        {
          reason: 'Reason',
          claimType: 'name',
          essential: true,
        },
      ],
      credentials: [],
    }

    const sdrJwt = await agent.handleAction({
      type: 'sign.sdr.jwt',
      data: sdrData,
    })

    const didCommData = {
      from: identity,
      to: 'did:ethr:rinkeby:0xb5e2f33b9137e63b6f42cce446fd501e6ed7ac05', // backoffice -- need to setup did doc to avoid url
      type: 'jwt',
      body: sdrJwt,
    }

    const message = await agent.handleAction({
      type: 'send.message.didcomm-alpha-1',
      data: didCommData,
      url: 'http://localhost:5000/requestCredential',
      save: false
    } as ActionSendDIDComm)

    setRequestJwt(message.raw)
  }

  return (
    <div>
      <h1>RIF Identity POC</h1>
      {error && <p>Error: {error}</p>}
      <h2>Create identity</h2>
      {
        !identity
          ? <button onClick={createIdentity}>Create</button>
          : <p>Identity: {identity}</p>
      }
      <hr />
      <h2>Request credential</h2>
      {
        !requestJwt
          ? <button onClick={requestCredential}>Request</button>
          : <p><a href={encodeURI(`https://jwt.io/#debugger-io?token=${requestJwt}`)}>jwt</a> {requestJwt}</p>
      }
    </div>
  );
}

export default App;
