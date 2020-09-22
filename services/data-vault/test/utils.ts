// return an 8 characters random string
export const getRandomString = (): string => Math.random().toString(36).substring(3, 11)
export const largeText = 'x'.repeat(52 * 1024)
