import React, { useState, useEffect } from 'react'
import axios from 'axios'

const backOfficeUrl = `http://localhost:${process.env.REACT_APP_BACKOFFICE_PORT}`

function App() {
  const [identity, setIdentity] = useState('')

  useEffect(() => {
    axios.get(backOfficeUrl + '/identity').then(res => setIdentity(res.data))
  }, [identity])

  return (
    <div>
      Issuer app
      Identity: {identity}
    </div>
  );
}

export default App;
