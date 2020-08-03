import React, { useState, useEffect } from 'react';
import { ActionSendDIDComm } from 'daf-did-comm'
import axios from 'axios'
import keccak256 from 'keccak256'
import { agent } from './setup'

type Request = { sdrJwt: string, message: string }

const issuer = `did:ethr:rinkeby:0xc623b302b62d2d40e2637521f66f855b37ffd5ce`
const issuerUrl = 'http://localhost:5000'

function App() {
  const [error, setError] = useState('')
  const [identity, setIdentity] = useState('')
  const [requestJwt, setRequestJwt] = useState('')
  const [requestHash, setRequestHash] = useState('')
  const [credentialJWT, setCredentialJWT] = useState('')
  const [credential, setCredential] = useState(null)

  const _credential = credential as any

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
          claimType: 'credentialRequest',
          claimValue: 'cred1'
        },
        {
          claimType: 'name',
          claimValue: 'Alan Turing',
          essential: true,
        },
        {
          claimType: 'age',
          claimValue: 35
        },
        {
          claimType: 'status',
          claimValue: 'coding...'
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
      to: issuer,
      type: 'jwt',
      body: sdrJwt,
    }

    const message = await agent.handleAction({
      type: 'send.message.didcomm-alpha-1',
      data: didCommData,
      url: issuerUrl + '/requestCredential', // need to setup did doc to avoid url
      save: false
    } as ActionSendDIDComm)

    setRequestJwt(message.raw)

    const hash = keccak256(sdrJwt).toString('hex')
    console.log(hash)
    setRequestHash(hash)
  }

  const receiveCredential = async () => axios.get(issuerUrl + `/receiveCredential/?hash=${requestHash}`)
    .then(res => res.status === 200 && res.data)
    .then(vc => { setCredentialJWT(vc); return vc })
    .then(vc => agent.handleMessage({ raw: vc, save: false, metaData: [] }))
    .then(m => setCredential(m.data))
    .catch(handleCatch)

  return (
    <div style={ { padding:10 } }>
      <h1>Holder app</h1>
      {error && <p>Error: {error}</p>}
      <h2>Create identity</h2>
      {
        !identity
          ? <button onClick={createIdentity}>Create</button>
          : <p>Identity: {identity}</p>
      }
      <hr />
      <h2>Request credential</h2>
      <p>Issuer: {issuer}</p>
      {
        !requestJwt
          ? <button onClick={requestCredential}>Request</button>
          : <p><a href={encodeURI(`https://jwt.io/#debugger-io?token=${requestJwt}`)}>jwt</a> {requestJwt}</p>
      }
      <hr />
      <h2>Receive the credential</h2>
      {
        !credentialJWT
          ? <button onClick={receiveCredential}>Receive</button>
          : <p>JWT: {credentialJWT}</p>
      }
      {
        _credential && <>
          iat: {_credential.iat}<br />
          iss: {_credential.iss}<br />
          sub: {_credential.sub}<br />
          vc<br />
          subject name: {_credential.vc.credentialSubject.name}<br />
          other claims: {_credential.vc.credentialSubject.otherClaims.length}<br />
        </>
      }
    </div>
  );
}

export default App;
