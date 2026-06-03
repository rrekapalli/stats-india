import { DashboardContainerComponent } from './dashboard-container.component';

describe('DashboardContainerComponent', () => {
  beforeEach(() => {
    cy.mount(DashboardContainerComponent);
  });

  it('should render the KTD grid', () => {
    cy.get('ktd-grid').should('exist');
  });

  it('should render each ktd-grid-item with vis-widget when widgets exist', () => {
    cy.get('ktd-grid-item').each(($item) => {
      cy.wrap($item).within(() => {
        cy.get('vis-widget').should('exist');
      });
    });
  });
});
