# Production deploy

Deploy all RIF Identity services using Docker containers and Docker compose.

This services are expected to be run:

- `rif-identity-ipfs-testnet` (not public - it is accessed only by `rif-identity-datavault-testnet`)
- `rif-identity-datavault-testnet`
- `rif-identity-tinyqr-testnet`
- `rif-identity-issuer-back-testnet`
- `rif-identity-issuer-front-testnet`

First clone the repo

```
git@github.com:rsksmart/rif-identity-services.git
cd rif-identity-services
```

Now setup the services:

#### Data vault

1. Go to `./data-vault`
2. Create a `.env` file with

    ```
    PRIVATE_KEY=c0d0bafd577fe198158270925613affc27b7aff9e8b7a7050b2b65f6eefd3083
    ADDRESS=0x4a795ab98dc3732d1123c6133d3efdc76d4c91f8
    RPC_URL=https://did.testnet.rsk.co:4444
    IPFS_PORT=5001
    IPFS_HOST=rif-identity-ipfs-testnet
    PORT=5102
    ```

> Two concerns about the private key:
> 1. It is stored raw.
> 2. Don't use the example, please generate a new one

> `IPFS_HOST` and `IPFS_PORT` refer to the IPFS container named `rif-identity-ipfs-testnet`. You should put here the container name that will be run in the same network as this service, or the dns name if running in another machine.

#### Tiny QR

1. Go to `./tiny-qr`
2. Create a `.env` file with

    ```
    TINY_QR_PORT=5103
    TINY_QR_URL=http://localhost:5103
    ```

> `TINY_QR_URL` must contain the DNS set for the tiny QR service

#### Issuer services

1. Go to `./issuer`
2. Create a `.env` file with

    ```
    SECRET_BOX_KEY=29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c
    CREDENTIAL_REQUESTS_PORT=5100
    REACT_APP_BACKOFFICE_PORT=5101
    RPC_URL=https://did.testnet.rsk.co:4444
    DEBUG=rif-id:*
    ADMIN_PASS=admin
    ```

> `SECRET_BOX_KEY` is used to encypt/decrypt key store, please change it.

> `ADMIN_PASS` is the password required to login to the front-end. Please change it.

#### Issuer front end

1. Go to `./issuer/app`
2. Create a `.env` file with

    ```
    SKIP_PREFLIGHT_CHECK=true
    REACT_APP_BACKOFFICE=http://localhost:5101
    ```

> `REACT_APP_BACKOFFICE` must contain the DNS set for the issuer back office service (started on port 5101)

## Run docker

1. Go to `./` (root folder)
2. Build the containers

    ```
    docker-compose build
    ```
  
3. Compose

    ```
    docker-compose up -d
    ```
  
4. Enable access to IPFS node container port 5001

    ```
    docker container ls
    # copy the id of the container named rif-identity-ipfs:latest
    docker exec -it COPIED-ID bash # e.g. 967eb3ce4730
    cd /root/.ipfs/
    apt update
    apt install vim
    vim config
    ```

    Update `“Addresses” -> “API”` and open ip4 port. Set `“API”: “/ipv4/0.0.0.0/tcp/5001"`

    Before the update

    ![beofre_update_ipfs](./img/beofre_update_ipfs.png)

    After the update

    ![after_update_ipfs](./img/after_update_ipfs.png)

    Save the file and exit the container

    ```
    exit
    ```

    Now restart IPFS docker

    ```
    docker restart COPIED-ID
    ```
    
Done!
