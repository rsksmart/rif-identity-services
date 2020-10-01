<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>rif-identity-services</code></h3>
<p align="middle">
    Services enabling RIF Self-sovereign.
</p>
<p align="middle">
    <a href="https://circleci.com/gh/rsksmart/rif-identity-services">
        <img src="https://img.shields.io/circleci/build/github/rsksmart/rif-identity-services?label=CircleCI" alt="npm" />
    </a>
    <a href="https://lgtm.com/projects/g/rsksmart/rif-identity-services/alerts/">
      <img src="https://img.shields.io/lgtm/alerts/github/rsksmart/rif-identity-services" alt="alerts">
    </a>
    <a href="https://lgtm.com/projects/g/rsksmart/rif-identity-services/context:javascript">
      <img src="https://img.shields.io/lgtm/grade/javascript/github/rsksmart/rif-identity-services">
    </a>
</p>

The project has different modules that run together form the RIF Identity main flow:

1. Holder sets and stores declarative details in their [Data Vault](https://github.com/rsksmart/rif-identity-services/tree/develop/services/data-vault)
2. Holder requests a credential using [credential requests service](https://github.com/rsksmart/rif-identity-services/tree/develop/services/issuer)
3. Issuer issues that credential using [credential requests backoffice](https://github.com/rsksmart/rif-identity-services/tree/develop/services/issuer)
4. Holder retrieves the credential
5. Holder stores it in the Data Vault
6. Holder presents a QR code using [the convey service](https://github.com/rsksmart/rif-identity-services/tree/develop/services/convey)
7. Verifier validates presentation retrieving it from the convey service

## Available servers

- Issuer: can receive credential requests with an open HTTPS service and grant/deny them using a backoffice
- Data vault: a user centric cloud like service. It allows users to pin files in IPFS, and memoize the content stored in a private dicitonary
- Convey: enables to transport arbitrary data via HTTPS. It is used to present credentials via QR code

## Setup

First install the dependencies

```
npm i
npm run setup
```

> If you are willing to run only one service you can install only its dependencies browsing into _packages/_

Compile `typescript` modules

```
npm run build
```

## Run tests

First, start an IPFS node

```
ipfs daemon
```

> Note that tests expect IPFS to run in port `5001`

Run the tests

```
npm test
```

Run package-specific tests

```
npm test:package --package rif-id-core
```

## Start services

The services are found in `./services` folder. To run the services please follow package specific instructions to set up `.env` files. You can opt for running each service individually or run the whole suite with Dockcer compose. To run each service individaully please reffer to service specific README

Using docker compose:

#### Setup

To use docker compose option, first you need to setup tha variable `DOCKER_TAG`. This will be the tag when creating the docker image. If no one is set, by default will take the TAG `latest`. For instance:

```bash
export DOCKER_TAG=latest
```

Setup the following `.env` variables. Look into each service section of this README to know how to complete them:

```text
./data-vault/.env
./issuer/.env
./issuer/app/.env
```

#### Execute

First, build the image:

```bash
docker-compose build 
```

Execute as daemon

```bash
docker-compose up -d
```

Identity service will start using it's own network
```bash
docker network ls
```
```bash
1d8ec230c51e        rif-identity-services_default   bridge              local
```
