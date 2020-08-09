import React, { useState } from 'react'
import { transformDID } from '../../transformers'

const Row = ({ request, grantCredential, denyCredential }) => {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <>
      <div className="row">
        <div className="col">{request.id}</div>
        <div className="col">{transformDID(request.from)}</div>
        <div className="col">{request.name}</div>
        <div className="col">{request.isValid ? 'valid' : 'invalid'}</div>
        <div className="col">{request.status}</div>
        <div className="col"><button className="btn btn-link" onClick={() => grantCredential(request.id)}>Grant</button></div>
        <div className="col"><button className="btn btn-link" onClick={() => denyCredential(request.id)}>Deny</button></div>
        <div className="col"><button className="btn btn-link" onClick={() => setShowDetails(!showDetails)}>show more</button></div>
      </div>
      {
        showDetails && request.sdr.map(claim => (
          <div className="row">
            <div className="col"><label>{claim.claimType}: {claim.claimValue}</label></div>
          </div>
        ))
      }
    </>
  )
}

export default Row
