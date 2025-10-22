// Development environment settings
// Local backend
export const environment = {
  production: false,
  isDevelopment: true,
  appUrl: 'http://localhost:4200',
  apiBase: 'https://localhost:7163',
  msalClientId: 'fed94c0a-fbac-465e-ae7f-b7ac6a08dd1b',
  msalAuthority:
    'https://af53b2d4-9ec3-4f23-92c7-50db6457512a.ciamlogin.com/af53b2d4-9ec3-4f23-92c7-50db6457512a',
  stripePublishableKey:
    'pk_test_51JeqpoLG3bFXwDbmaME3OmONpy36GtBFjCk4FH3XW7vlEfYceexOpPhjFvQnbNUVQMpKEHK3I1VzeQcLWzWWNqFa00ffzmzbva',
} as const;
