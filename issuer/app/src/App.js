import React, { useState, useEffect } from 'react'
import axios from 'axios'

const backOfficeUrl = `http://localhost:${process.env.REACT_APP_BACKOFFICE_PORT}`

function App() {
  const [error, setError] = useState('')
  const [identity, setIdentity] = useState('')
  const [requests, setRequests] = useState([])

  console.log(requests)

  const getIdentity = () => axios.get(backOfficeUrl + '/identity').then(res => res.data).then(setIdentity)
  const getMessagesSince = () => axios.get(`${backOfficeUrl}/requests`).then(res => res.data).then(setRequests)

  const putActionFactory = (status) => (id) => axios.put(`${backOfficeUrl}/request/${id}/status/${status}`)
    .then(res => {
      if (res.status !== 200) throw new Error(res.data)
      return res.data
    })
    .then(cr => setRequests(requests.map(request => request.id === cr.id ? cr : request)))
    .catch(error => setError(error.message))

  const grantCredential = putActionFactory('granted')
  const denyCredential = putActionFactory('denied')

  useEffect(() => {
    getIdentity()
    getMessagesSince()
  }, [])

  return (
    <div style={ { padding:10 } }>
      <h1>Issuer app</h1>
      Identity: {identity}
      {error && <p> Error: {error}</p>}
      <table>
        <thead>
          <tr>
            <th></th>
            <th>From</th>
            <th>Name</th>
            <th>Selective disclosure request</th>
            <th>JWT status</th>
            <th>Request status</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request, i) => (
            <tr key={i}>
              <td>{request.id}</td>
              <td>{request.from}</td>
              <td>{request.name}</td>
              <td>{`[`} {request.sdr.map(claim => `{ ${claim.claimType}: ${claim.claimValue}}`)} {`]`}</td>
              <td>{request.isValid ? 'valid' : 'invalid'}</td>
              <td>{request.status}</td>
              <td><button onClick={() => grantCredential(request.id)}>Grant</button></td>
              <td><button onClick={() => denyCredential(request.id)}>Deny</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
