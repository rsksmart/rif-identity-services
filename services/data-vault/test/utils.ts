import { Logger } from '@rsksmart/rif-node-utils/lib/logger'

// return an 8 characters random string
export const getRandomString = (): string => Math.random().toString(36).substring(3, 11)
export const largeText = 'x'.repeat(52 * 1024)
export const mockedLogger = { info: () => {}, error: () => {} } as unknown as Logger
