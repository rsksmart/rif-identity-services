import React, { useState, useEffect } from 'react';
import { ActionSendDIDComm } from 'daf-did-comm'
import axios from 'axios'
import keccak256 from 'keccak256'
import { agent } from './setup'

const issuer = `did:ethr:rsk:testnet:0xc253a4d5653ea8b1b288a4b45ba67e9a4be865fc`
const verifier = `did:ethr:rinkeby:0xf93cc6465ca4dead223756481da777be08da24a1`

const issuerUrl = 'http://localhost:5100'
const dataVaultUrl = 'http://localhost:5102'
const tinyQRUrl = 'http://localhost:5103'

function App() {
  const [error, setError] = useState('')

  const [identity, setIdentity] = useState('')

  const [requestJwt, setRequestJwt] = useState('')
  const [requestHash, setRequestHash] = useState('')
  const [credentialJWT, setCredentialJWT] = useState('')
  const [credential, setCredential] = useState(null)

  const [dataVaultIdentity, setDataVaultIdentity] = useState('')
  const [authTryResult, setAuthTryResult] = useState('')
  const [credentialCID, setCredentialCID] = useState('')
  const [credentialCIDsRecovered, setCredentialCIDsRecovered] = useState('')

  const [qrData, setQrData] = useState({})
  const [presentationJWT, setPresentationJWT] = useState('')
  const [verifyUrl, setVerifyUrl] = useState('')
  const [verifyPwd, setVerifyPwd] = useState('')
  const [verifyHash, setVerifyHash] = useState('')
  const [verification, setVerification] = useState(0)

  const _credential = credential as any

  const handleCatch = (error: Error) => { setError(error.message); console.error(error); return error }

  useEffect(() => {
    Promise.all([
      agent.identityManager.getIdentities()
        .then((identities) => {
          if (identities.length) setIdentity(identities[0].did)
        })
        .catch(handleCatch),
      axios.get(dataVaultUrl + '/identity')
        .then(res => res.status === 200 && res.data)
        .then(setDataVaultIdentity)
        //.catch(handleCatch)
    ])
  }, [])

  /** identity operations */
  const createIdentity = () => agent.identityManager.createIdentity()
    .then(({ did }) => setIdentity(did))
    .catch(handleCatch)

  /** request operations */
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

  /** data vault operations */
  const login = () => axios.post(dataVaultUrl + '/auth', { did: identity })
    .then(res => res.status === 200 && res.data)
    .then(data => agent.handleMessage({ raw: data, save: false, metaData: [] }))
    .then(message => (message.credentials[0].credentialSubject as any).token)

  const loginAndSendClaimWithToken = (claim: any, method: string, setResult: ((data: any) => any)) => login()
    .then(token => agent.handleAction({
      type: 'sign.sdr.jwt',
      data: {
        issuer: identity,
        claims: [{ claimType: 'token', claimValue: token }, claim]
      }
    }))
    .then(jwt => axios.post(dataVaultUrl + method, { jwt }))
    .then(res => res.status === 200 && res.data)
    .then(setResult)

  const tryDataVaultAuth = () => loginAndSendClaimWithToken(null, '/testAuth', setAuthTryResult).catch(handleCatch)
  const storeCredential = () => loginAndSendClaimWithToken({ claimType: 'content', claimValue: credentialJWT }, '/put', setCredentialCID).catch(handleCatch)
  const getCredentials = () => loginAndSendClaimWithToken(
    null,
    '/get',
    (data: string[]) => setCredentialCIDsRecovered(data.reduce((a, c) => c + ' - ' + a, ''))
  ).catch(handleCatch)

  const present = () => agent.handleAction({
    type: 'sign.w3c.vp.jwt',
    save: false,
    data: {
      issuer: identity,
      subject: verifier,
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      verifiableCredential: [credentialJWT],
    },
  } as any)
    .then(presentation => setPresentationJWT(presentation.raw))
    .then(() => axios.post(tinyQRUrl + '/presentation', { jwt: presentationJWT }))
    .then(res => res.status === 200 && res.data)
    .then(data => ({ vpHash: keccak256(presentationJWT).toString('hex'), ...data }))
    .then(setQrData)

  const getQRUrl = () => `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${JSON.stringify(qrData)}&choe=UTF-8`

  const verify = () => axios.post(verifyUrl, { pwd: verifyPwd })
    .then(res => res.status === 200 && res.data)
    .then(data => data.jwt)
    .then(jwt => keccak256(jwt).toString('hex') !== verifyHash ? (() => { throw new Error('Invalid response') })() : jwt)
    .then(jwt => agent.handleMessage({ raw: jwt, save: false }))
    .then(message => message?.getLastMetaData()?.type === 'JWT' ? 1 : -1)
    .catch(() => -1)
    .then(setVerification)

  return (
    <div style={ { padding:10 } }>
      <h1>Holder app</h1>
      {error && <p>Error: {error}</p>}
      <h2>Identity</h2>
      {
        !identity
          ? <button onClick={createIdentity}>Create</button>
          : <p>Identity: {identity}</p>
      }
      <hr />
      <h2>Selective disclosure request</h2>
      <h3>Request credential</h3>
      <p>Issuer: {issuer}</p>
      {
        !requestJwt
          ? <button onClick={requestCredential}>Request</button>
          : <p><a href={encodeURI(`https://jwt.io/#debugger-io?token=${requestJwt}`)}>jwt</a> {requestJwt}</p>
      }
      <h3>Receive the credential</h3>
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
      <hr />
      <h2>Data vault</h2>
      <p>DV Identity: {dataVaultIdentity}</p>
      <h3>Try auth</h3>
      <button onClick={tryDataVaultAuth}>Try</button>
      <p>{authTryResult}</p>
      <h3>Store in data vault</h3>
      <button onClick={storeCredential}>Store</button>
      <p>{credentialCID}</p>
      <h3>Restore backup</h3>
      <button onClick={getCredentials}>Recover</button>
      <p>{credentialCIDsRecovered}</p>
      <hr />
      <h2>Presentation</h2>
      <h3>Create presentation</h3>
      <button onClick={present}>Present</button>
      {
        (qrData as any).url && <img src={getQRUrl()} />
      }
      <hr />
      <h1>Verifier app</h1>
      <p>Identity: ${verifier}</p>
      <h2>Verify presentation</h2>
      <input type="text" placeholder="url" value={verifyUrl} onChange={e => setVerifyUrl(e.target.value)} />
      <input type="text" placeholder="pwd" value={verifyPwd} onChange={e => setVerifyPwd(e.target.value)} />
      <input type="text" placeholder="hash" value={verifyHash} onChange={e => setVerifyHash(e.target.value)} />
      <button onClick={verify}>Verify</button>
      <p>{verification > 0 ? 'Ok' : (verification < 0 ? 'Error' : '')}</p>
    </div>
  );
}

export default App;
