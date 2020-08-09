import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './index.css'
import { backOfficeUrl } from '../../adapters'
import Row from './Row'

function Requests() {
  const [error, setError] = useState('')
  const [requests, setRequests] = useState([])

  const handleCatch = e => setError(e.message)

  const getMessagesSince = () => axios.get(`${backOfficeUrl}/requests`).then(res => res.data).then(setRequests).catch(handleCatch)

  const putActionFactory = (status) => (id) => axios.put(`${backOfficeUrl}/request/${id}/status/${status}`)
    .then(res => {
      if (res.status !== 200) throw new Error(res.data)
      return res.data
    })
    .then(cr => setRequests(requests.map(request => request.id === cr.id ? cr : request)))
    .catch(handleCatch)

  const grantCredential = putActionFactory('granted')
  const denyCredential = putActionFactory('denied')

  useEffect(() => {
    getMessagesSince()
  }, [])

  return (
    <div className="container">
      <h3 className="reply-title">Credential requests</h3>
      {error && <div className="alert alert-danger"><p> Error: {error}</p></div>}

      <table className="table reply-table">
        <thead className="reply-table-header">
          <tr>
            <th>Id</th>
            <th>From</th>
            <th>Name</th>
            <th>Valid</th>
            <th>Status</th>
            <th></th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <Row key={request.id} request={request} grantCredential={grantCredential} denyCredential={denyCredential} />
          ))}
        </tbody>
      </table>
      <button onClick={getMessagesSince} className="btn btn-link">reload</button>
    </div>
  );
}

export default Requests;
