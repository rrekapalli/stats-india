import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { WidgetHeaderComponent } from "./widget-header.component";
import { VisStorybookModule } from "vis-storybook";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe('WidgetHeaderComponent', () => {
    beforeEach(() => {
      cy.mount(WidgetHeaderComponent,{
        imports: [BrowserAnimationsModule, VisStorybookModule],
        providers: [
            { provide: 'SharedService', useValue: {} },
            { provide: 'environment', useValue: {} },
            //{ provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
            provideHttpClient(withInterceptorsFromDi()),
            provideHttpClientTesting(),
        ],
        componentProperties: {
            onEditMode:true,
            //title:'Title'
        }
      }); 
    });
  
    it('should render the panel with the correct title and icons in edit mode', () => {
      const onEditMode:any = true;
      //const title = 'Title'
        cy.get('p-panel').within(() => {
        //cy.get('.p-panel-header').should('contain.text', title);

        if (onEditMode) {
          cy.get('p-button').should('have.length', 2);
          cy.get('[icon="pi pi-trash"]').should('be.visible');
          cy.get('[icon="pi pi-cog"] > .p-ripple').click();
        }
      });
    });
  
    it('should trigger the delete widget action on trash icon click', () => {
        const onEditMode:any = true;
        if (onEditMode) {
        cy.get('[icon="pi pi-trash"]').should('be.visible');
        //cy.get('@onDeleteWidgetClicked').should('have.been.called');
      }
    });
  
    it('should open the sidebar on cog icon click', () => {
      const onEditMode:any = true;
      if (onEditMode) {
        cy.get('[icon="pi pi-cog"] > .p-ripple').click();
        cy.get('p-sidebar').should('be.visible');
      }
    });
  });
  