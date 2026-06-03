import { WidgetConfigComponent } from "./widget-config.component";

describe('WidgetConfigComponent', () => {
    beforeEach(() => {
      cy.mount(WidgetConfigComponent); 
    });
  
    it('should render the scroll panel with the correct styles', () => {
      cy.get('#panelId p-scrollPanel')
        .should('have.css', 'height', '425px')
        .and('have.css', 'width', '500px')
        .and('have.css', 'overflow-x', 'visible')
        .and('have.css', 'overflow', 'visible');
    });
  

  
    it('should trigger form submission on clicking Submit button', () => {
      cy.get('p-button[label="Submit"]').click();
      //cy.get('@onSubmit').should('have.been.called');
    });
  
    it('should render and trigger the Edit button', () => {
      cy.get('p-button[label="Edit"]')
        .should('exist')
        .and('have.class', 'ui-button-warning')
        .click();
    });
  
    it('should render and trigger the Reset button', () => {
      cy.get('p-button[label="Reset"]')
        .should('exist')
        .and('have.class', 'ui-button-danger')
        .click();
    });
  });
  