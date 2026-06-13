import { authClient, isNeonAuthConfigured } from './authClient';

export const authenticatedFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  if (!isNeonAuthConfigured) throw new Error('Neon Auth is not configured.');

  const sessionResult = await authClient.getSession({
    query: { disableCookieCache: true },
    fetchOptions: { headers: { 'X-Force-Fetch': 'true' } },
  });
  const sessionToken = sessionResult.data?.session.token;
  let token = sessionToken?.split('.').length === 3 ? sessionToken : undefined;

  if (!token) {
    const tokenResult = await authClient.token();
    token = tokenResult.data?.token;
    if (tokenResult.error || !token) {
      throw new Error(tokenResult.error?.message || 'Neon Auth did not return an access token. Please sign in again.');
    }
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, { ...init, headers });
};
