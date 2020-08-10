import React, { useState } from 'react'
import { transformDID } from '../../transformers'

const Row = ({ request, grantCredential, denyCredential }) => {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <>
      <tr>
        <td>{request.id}</td>
        <td>{transformDID(request.from)}</td>
        <td>{request.name}</td>
        <td>{request.isValid ? 'valid' : 'invalid'}</td>
        <td>{request.status}</td>
        <td><button className="btn btn-link" onClick={() => grantCredential(request.id)}>Grant</button></td>
        <td><button className="btn btn-link" onClick={() => denyCredential(request.id)}>Deny</button></td>
        <td><button className="btn btn-link" onClick={() => setShowDetails(!showDetails)}>{showDetails ? 'show less' : 'show more'}</button></td>
      </tr>
      {
        showDetails && request.sdr.map(claim => (
          <tr className='row-more-info'><td colSpan={9}>{claim.claimType}: {claim.claimValue}</td></tr>
        ))
      }
    </>
  )
}

export default Row
