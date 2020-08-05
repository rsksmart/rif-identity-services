# RIF Identity POC

To start the POC:

1. Start issuer backend
2. Start issuer front end
3. Start the ipfs node
4. Start the data vault
5. Start the holder app (web)
6. Extra: run the IPFS react native app

Usage:

- Create identity

  1. Create an identity in the holder app
  2. You will see your DID

- Request a credential

  1. Click on request and wait until a JWT shows up
  2. Reload the issuer app and see a new entry for the requested credential
  3. Back in the holder app, click receive the credential and wait until the payload is decoded

- Store credential in data vault

  1. Click try auth to check authentication flow
  2. Click on store to store the credential
  3. Click on retrieve to retrieve all stored credentials

- Verify content hashes

  1. Open the IPFS app
  2. Paste a hash
  3. Click on get and wait - it can take a while

- Present credential

  1. After issuing a credential (not necessarily synced to the data vault), click on present
  2. A QR will be displayed
  3. You can read

- Verify a presentation

  1. Scan the QR and get its JSON data - you can use a tool like [this one](https://www.ginifab.com/feeds/qr_code/qr_code_scanner.html)
  2. Copy the fields values and paste them in the text boxes
  3. Click on verify - it will show 'Ok' or 'Error'
