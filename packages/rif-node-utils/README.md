<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>rif-node-utils</code></h3>
<p align="middle">
    RIF Node.js utils
</p>
<p align="middle">
    <a href="https://badge.fury.io/js/%40rsksmart%2Frif-node-utils">
        <img src="https://badge.fury.io/js/%40rsksmart%2Frif-node-utils.svg" alt="npm" />
    </a>
</p>

```
npm i @rsksmart/rif-node-utils
```

## Features

- Logger

## Usage

Logging:

```typescript
import { loggerFactory } from '@rsksmart/rif-node-utils'
import dotenv from 'dotenv'

const createLogger = loggerFactory({
  env: env.ENV, // if set to 'dev', logs in console
  infoFile: env.LOG_INFO_PATH,
  errorFile: env.LOG_ERROR_PATH
})

const logger = createLogger('rif-node-utils')
const logger2 = createLogger('rif-node-utils-2') // will log with a different prefix
```
