// Development environment settings
// Local backend
export const environment = {
  production: false,
  apiBase: 'http://localhost:5099',
  msalClientId: 'fed94c0a-fbac-465e-ae7f-b7ac6a08dd1b',
  msalAuthority: 'https://entraIdExternal.ciamlogin.com/',
} as const;
