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
// myLogger.ts
import { loggerFactory } from '@rsksmart/rif-node-utils'
import dotenv from 'dotenv'

dotenv.config()

const ENV = process.env.NODE_ENV || 'dev'
const FILE = process.env.LOG_FILE || './log/issuer-backend.log'
const ERROR_FILE = process.env.LOG_ERROR_FILE || './log/issuer-backend.error.log'

export default loggerFactory({
  env: ENV,
  infoFile: FILE,
  errorFile: ERROR_FILE
})

// script.js
import myLogger from './myLogger'

const logger = myLogger('super-logger')

logger.info('Info message')
logger.error('Error message')
```
