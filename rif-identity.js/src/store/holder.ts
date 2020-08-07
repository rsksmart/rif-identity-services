import { configureIdentityStore } from './identity'

export const configureHolderStore = () => configureIdentityStore({})

export type HolderStore = ReturnType<typeof configureHolderStore>
