# Issuer

Install:

```
npm i
```

Setup: create a `.env` file with

```
DEBUG= rif-id:* for app logging - * for all logs
CREDENTIAL_REQUESTS_PORT= port to run credential requests service
SECRET_BOX_KEY= 32 random bytes in hex representation - encryption key
INFURA_PROJECT_ID= id for rinkeby
```

Run:

```
npm run start
```

Develop:

```
npm run dev
```
