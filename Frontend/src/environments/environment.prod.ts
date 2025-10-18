// Production environment settings
export const environment = {
  production: true,
  isDevelopment: false,
  apiBase: 'https://fullstack-app-prod.azurewebsites.net',
  msalClientId: 'b71ddc9e-2cc7-412e-ba06-a758a0d3a7b7',
  msalAuthority:
    'https://af53b2d4-9ec3-4f23-92c7-50db6457512a.ciamlogin.com/af53b2d4-9ec3-4f23-92c7-50db6457512a',
  stripePublishableKey:
    'pk_test_51JeqpoLG3bFXwDbmaME3OmONpy36GtBFjCk4FH3XW7vlEfYceexOpPhjFvQnbNUVQMpKEHK3I1VzeQcLWzWWNqFa00ffzmzbva',
} as const;
