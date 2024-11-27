export function validateAccessToken(token: string): boolean {
  return token.length > 0;
}

export function validateUid(uid: string): boolean {
  return uid.length > 0;
}

export function validateClient(client: string): boolean {
  return client.length > 0;
}

export function validateTransactionAmount(amount: number): boolean {
  return amount > 0;
}
