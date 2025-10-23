describe('Critical User Flow - Guest Shopping', { testIsolation: false }, () => {
  before(() => {
    // Clear cart before running any tests
    cy.clearCart();
  });

  beforeEach(() => {
    cy.visit('/');
  });

  it('should allow guest to browse and add products to cart', () => {
    // Step 1: Verify products loaded
    cy.get('[data-testid="featured-card"]').should('have.length.at.least', 2);

    // Step 2: Add first product to cart
    cy.get('[data-testid="featured-card"]')
      .eq(0)
      .within(() => {
        cy.get('[data-testid="add-to-cart"]').click();
      });

    // Step 3: Verify cart badge shows 1
    cy.get('[data-testid="cart-badge"]').should('contain.text', '1');

    // Step 4: Add second product to cart
    cy.get('[data-testid="featured-card"]')
      .eq(1)
      .within(() => {
        cy.get('[data-testid="add-to-cart"]').click();
      });

    // Step 5: Verify cart badge shows 2
    cy.get('[data-testid="cart-badge"]').should('contain.text', '2');

    // Step 6: Navigate to cart page
    cy.contains('a, button', /cart/i).first().click();
    cy.url().should('include', '/cart');
    cy.get('[data-testid="cart-item"]').first().should('be.visible');

    // Step 7: Verify both products are in cart
    cy.get('[data-testid="cart-item"]').should('have.length', 2);

    // Step 8: Increment quantity of first product
    cy.get('[data-testid="cart-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-testid="qty-increase"]').click();
      });

    // Step 9: Verify quantity updated to 2
    cy.get('[data-testid="cart-item"]')
      .eq(0)
      .within(() => {
        cy.get('[data-testid="qty-input"]').should('have.value', '2');
      });

    // Step 10: Verify total item count is 3
    cy.get('[data-testid="order-summary-panel"]').should('contain.text', '3');

    // Step 11: Remove second product from cart
    cy.get('[data-testid="cart-item"]')
      .eq(1)
      .within(() => {
        cy.get('[data-testid*="remove-btn"]').first().click();
      });

    // Step 12: Verify only 1 item remains
    cy.get('[data-testid="cart-item"]').should('have.length', 1);

    // Step 13: Verify item count is now 2
    cy.get('[data-testid="order-summary-panel"]').should('contain.text', '2');
  });
});
