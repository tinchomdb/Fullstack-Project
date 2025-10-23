/// <reference types="cypress" />
import './types';

Cypress.Commands.add('clearCart', () => {
  cy.visit('/cart');
  cy.url().should('include', '/cart');

  // Wait for the cart container to be visible first
  /* cy.wait(5000); */
  cy.get('[data-testid="cart-item"], [data-testid="empty-cart"]').should('be.visible');

  // Then check if cart has items or is empty
  cy.get('body').then(($body) => {
    const $items = $body.find('[data-testid="cart-item"]');

    if ($items.length === 0) {
      // Cart is already empty, nothing to do
      return;
    }

    // Remove all items by clicking remove buttons
    cy.get('[data-testid="cart-item"]').each(() => {
      cy.get('[data-testid*="remove-btn"]').first().click();
      cy.wait(300);
    });

    // Verify cart is now empty
    cy.get('[data-testid="cart-item"]').should('not.exist');
  });
});
