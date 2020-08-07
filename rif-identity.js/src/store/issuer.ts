import { configureIdentityStore } from './identity'

export const configureIssuerStore = () => configureIdentityStore({})

export type IssuerStore = ReturnType<typeof configureIssuerStore>
