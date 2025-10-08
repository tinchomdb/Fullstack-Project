// Production environment settings
export const environment = {
  production: true,
  apiBase: 'https://fullstack-app-prod.azurewebsites.net',
  msalClientId: 'b71ddc9e-2cc7-412e-ba06-a758a0d3a7b7',
  msalAuthority: 'https://entraIdExternal.ciamlogin.com/',
} as const;
