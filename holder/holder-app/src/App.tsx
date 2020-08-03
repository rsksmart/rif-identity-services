import React, { useState, useEffect } from 'react';
import { agent } from './setup'

function App() {
  const [error, setError] = useState('')
  const [identity, setIdentity] = useState('')

  const handleCatch = (error: Error) => { setError(error.message); console.error(error); return error }

  useEffect(() => {
    agent.identityManager.getIdentities()
      .then((identities) => {
        if (identities.length) setIdentity(identities[0].did)
      })
      .catch(handleCatch)
  }, [])

  const createIdentity = () => agent.identityManager.getIdentityProviders()[0].createIdentity()
    .then(({ did }) => setIdentity(did))
    .catch(handleCatch)

  return (
    <div>
      <h1>RIF Identity POC</h1>
      <h2>Create identity</h2>
      {
        !identity
          ? <button onClick={createIdentity}>Create</button>
          : <p>Identity: {identity}</p>
      }
    </div>
  );
}

export default App;
