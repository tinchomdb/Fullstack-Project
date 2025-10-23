declare namespace Cypress {
  interface Chainable<Subject = any> {
    clearCart(): Chainable<Subject>;
  }
}
