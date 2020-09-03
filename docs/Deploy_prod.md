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
    PRIVATE_KEY=COMPLETE WITH YOUR PRIVATE KEY
    ADDRESS=COMPLETE WITH YOUR ADDRESS
    RPC_URL=https://did.testnet.rsk.co:4444
    IPFS_PORT=5001
    IPFS_HOST=rif-identity-ipfs-testnet
    PORT=5102
    DATABASE_FILE=./db/data-vault-mapper.sqlite
    LOG_FILE=./log/data-vault.log
    LOG_ERRORS_FILE=./log/data-vault.error.log
    NODE_ENV=production
    ```

> The private key is stored raw.

> `IPFS_HOST` and `IPFS_PORT` refer to the IPFS container named `rif-identity-ipfs-testnet`. You should put here the container name that will be run in the same network as this service, or the dns name if running in another machine.

#### Tiny QR

1. Go to `./tiny-qr`
2. Create a `.env` file with

    ```
    TINY_QR_PORT=5103
    TINY_QR_URL=COMPLETE WITH THE DNS SET OF THIS SERVICE
    ```

> `TINY_QR_URL` must contain the DNS set for the tiny QR service

#### Issuer services

1. Go to `./issuer`
2. Create a `.env` file with

    ```
    SECRET_BOX_KEY=COMPLETE WITH YOUR SECRET BOX KEY
    CREDENTIAL_REQUESTS_PORT=5100
    REACT_APP_BACKOFFICE_PORT=5101
    RPC_URL=https://did.testnet.rsk.co:4444
    ADMIN_PASS=COMPLETE WITH YOUR ADMIN PASS
    LOG_FILE=./log/issuer-backend.log
    LOG_ERRORS_FILE=./log/issuer-backend.error.log
    DB_FILE=./db/issuer.sqlite
    NODE_ENV=production
    ```

> `SECRET_BOX_KEY` is used to encypt/decrypt key store.

> `ADMIN_PASS` is the password required to login to the front-end, it is stored raw.

#### Issuer front end

1. Go to `./issuer/app`
2. Create a `.env` file with

    ```
    SKIP_PREFLIGHT_CHECK=true
    REACT_APP_BACKOFFICE=COMPLETE WITH THE DNS SET OF THE ISSUER BACK OFFICE
    ```

> `REACT_APP_BACKOFFICE` must contain the DNS set for the issuer back office service (started on port 5101)

#### IMPORTANT NOTE:

If you don't use the default values provided for the `DB` and `LOGS` paths, please make sure to update also the right hand of `docker-compose.yml`'s `volumes` lines. They must be kept in sync

## Run docker

1. Create dirs where the logs and dbs will be saved:

```
mkdir /var/db/rif-identity # you may need sudo
mkdir /var/log/rif-identity
```

2. Give permissions for everyone to write in those created folders

```
chmod -R 777 /var/db/rif-identity/  # you may need sudo
chmod -R 777 /var/log/rif-identity/
```

3. Open Docker Preferences -> File Sharing and add just created dirs to the list of available directories

4. Click on `Apply & Restart`

5. Go to `./` (root folder)
6. Build the containers

    ```
    docker-compose build
    ```
  
7. Compose

    ```
    docker-compose up -d
    ```
  
8. Enable access to IPFS node container port 5001

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
    
    <img src="./beofre_update_ipfs.png" height="200" />

    After the update

    <img src="./after_update_ipfs.png" height="200" />

    Save the file and exit the container

    ```
    exit
    ```

    Now restart IPFS docker

    ```
    docker restart COPIED-ID
    ```
    
Done!
