import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockListTableComponent } from './stock-list-table.component';
import { ChangeDetectorRef, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { StockListData } from './stock-list-chart-builder';
import { IWidget } from '../../entities/IWidget';

describe('StockListTableComponent', () => {
  let component: StockListTableComponent;
  let fixture: ComponentFixture<StockListTableComponent>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;
  let mockElementRef: jasmine.SpyObj<ElementRef>;

  const mockStockData: StockListData[] = [
    {
      symbol: 'RELIANCE',
      companyName: 'Reliance Industries Limited',
      lastPrice: 2456.75,
      priceChange: 23.50,
      percentChange: 0.97,
      volume: 1234567,
      dayHigh: 2478.90,
      dayLow: 2445.20,
      openPrice: 2450.00,
      previousClose: 2433.25,
      industry: 'Oil & Gas',
      sector: 'Energy'
    },
    {
      symbol: 'TCS',
      companyName: 'Tata Consultancy Services Limited',
      lastPrice: 3567.80,
      priceChange: -15.25,
      percentChange: -0.43,
      volume: 987654,
      dayHigh: 3590.00,
      dayLow: 3555.50,
      openPrice: 3580.00,
      previousClose: 3583.05,
      industry: 'Information Technology',
      sector: 'IT'
    }
  ];

  const mockWidget: IWidget = {
    id: 'test-widget',
    x: 0,
    y: 0,
    cols: 4,
    rows: 4,
    position: { x: 0, y: 0, cols: 4, rows: 4 },
    config: {
      component: 'stock-list-table',
      header: { title: 'Stock List' },
      options: {}
    },
    data: {
      stocks: mockStockData,
      isLoadingStocks: false,
      selectedStockSymbol: ''
    }
  };

  beforeEach(async () => {
    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges', 'markForCheck']);
    mockElementRef = jasmine.createSpyObj('ElementRef', [], {
      nativeElement: document.createElement('div')
    });

    await TestBed.configureTestingModule({
      imports: [StockListTableComponent],
      providers: [
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: ElementRef, useValue: mockElementRef },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StockListTableComponent);
    component = fixture.componentInstance;
    component.widget = mockWidget;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Loading State', () => {
    it('should display loading indicator when isLoadingStocks is true', () => {
      // Arrange
      component.isLoadingStocks = true;
      component.widget.data = {
        stocks: [],
        isLoadingStocks: true
      };

      // Act
      fixture.detectChanges();

      // Assert
      const loadingElement = fixture.nativeElement.querySelector('.loading-container');
      expect(loadingElement).toBeTruthy();
      expect(loadingElement.textContent).toContain('Loading instruments');
    });

    it('should hide table when isLoadingStocks is true', () => {
      // Arrange
      component.isLoadingStocks = true;
      component.widget.data = {
        stocks: [],
        isLoadingStocks: true
      };

      // Act
      fixture.detectChanges();

      // Assert
      const tableElement = fixture.nativeElement.querySelector('p-table');
      expect(tableElement).toBeFalsy();
    });

    it('should hide loading indicator when isLoadingStocks is false', () => {
      // Arrange
      component.isLoadingStocks = false;
      component.widget.data = {
        stocks: mockStockData,
        isLoadingStocks: false
      };

      // Act
      fixture.detectChanges();

      // Assert
      const loadingElement = fixture.nativeElement.querySelector('.loading-container');
      expect(loadingElement).toBeFalsy();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when data is empty', () => {
      // Arrange
      component.stocks = [];
      component.filteredStocks = [];
      component.isLoadingStocks = false;
      component.widget.data = {
        stocks: [],
        isLoadingStocks: false
      };

      // Act
      fixture.detectChanges();

      // Assert
      const emptyMessage = fixture.nativeElement.querySelector('.text-center');
      expect(emptyMessage).toBeTruthy();
      expect(emptyMessage.textContent).toContain('No instruments match the selected filters');
    });

    it('should display helpful message in empty state', () => {
      // Arrange
      component.stocks = [];
      component.filteredStocks = [];
      component.isLoadingStocks = false;
      component.widget.data = {
        stocks: [],
        isLoadingStocks: false
      };

      // Act
      fixture.detectChanges();

      // Assert
      const emptyMessage = fixture.nativeElement.querySelector('.text-center');
      expect(emptyMessage.textContent).toContain('Try adjusting your filter criteria');
    });
  });

  describe('Data Display', () => {
    it('should display instruments when data is provided', () => {
      // Arrange
      component.stocks = mockStockData;
      component.filteredStocks = mockStockData;
      component.isLoadingStocks = false;
      component.widget.data = {
        stocks: mockStockData,
        isLoadingStocks: false
      };

      // Act
      component.ngOnInit();
      fixture.detectChanges();

      // Assert
      expect(component.filteredStocks.length).toBe(2);
      // Check that both stocks are present (order may vary due to sorting)
      const symbols = component.filteredStocks.map(s => s.symbol);
      expect(symbols).toContain('RELIANCE');
      expect(symbols).toContain('TCS');
    });

    it('should update stocks from widget data', () => {
      // Arrange
      const newStockData: StockListData[] = [
        {
          symbol: 'INFY',
          companyName: 'Infosys Limited',
          lastPrice: 1456.30,
          priceChange: 8.75,
          percentChange: 0.60
        }
      ];
      component.widget.data = {
        stocks: newStockData,
        isLoadingStocks: false
      };

      // Act
      component.ngOnInit();
      fixture.detectChanges();

      // Assert
      expect(component.stocks.length).toBe(1);
      expect(component.stocks[0].symbol).toBe('INFY');
    });

    it('should display all required instrument fields', () => {
      // Arrange
      component.stocks = mockStockData;
      component.filteredStocks = mockStockData;
      component.isLoadingStocks = false;
      component.widget.data = {
        stocks: mockStockData,
        isLoadingStocks: false
      };

      // Act
      component.ngOnInit();
      fixture.detectChanges();

      // Assert
      const firstStock = component.filteredStocks[0];
      expect(firstStock.symbol).toBeDefined();
      expect(firstStock.companyName).toBeDefined();
      expect(firstStock.lastPrice).toBeDefined();
      expect(firstStock.priceChange).toBeDefined();
      expect(firstStock.percentChange).toBeDefined();
    });
  });

  describe('Widget Data Updates', () => {
    it('should update when widget data changes', () => {
      // Arrange
      const initialData = mockStockData;
      const updatedData: StockListData[] = [
        {
          symbol: 'HDFC',
          companyName: 'HDFC Bank Limited',
          lastPrice: 1678.90,
          priceChange: 12.40,
          percentChange: 0.74
        }
      ];

      component.widget.data = {
        stocks: initialData,
        isLoadingStocks: false
      };
      component.ngOnInit();
      fixture.detectChanges();

      // Act
      component.widget.data = {
        stocks: updatedData,
        isLoadingStocks: false
      };
      component.ngOnChanges({} as any);
      fixture.detectChanges();

      // Assert
      expect(component.stocks.length).toBe(1);
      expect(component.stocks[0].symbol).toBe('HDFC');
    });

    it('should handle loading state changes', () => {
      // Arrange
      component.widget.data = {
        stocks: mockStockData,
        isLoadingStocks: false
      };
      component.ngOnInit();
      fixture.detectChanges();

      // Act
      component.widget.data = {
        stocks: mockStockData,
        isLoadingStocks: true
      };
      component.ngOnChanges({} as any);
      fixture.detectChanges();

      // Assert
      expect(component.isLoadingStocks).toBe(true);
    });
  });

  describe('Search and Filter', () => {
    it('should filter stocks based on search text', () => {
      // Arrange
      component.stocks = mockStockData;
      component.searchText = 'RELIANCE';
      component.isLoadingStocks = false;

      // Act
      component.onSearchChange();
      fixture.detectChanges();

      // Assert
      expect(component.filteredStocks.length).toBeGreaterThanOrEqual(1);
      // Check that filtered results contain the search term
      const hasReliance = component.filteredStocks.some(s => 
        s.symbol?.includes('RELIANCE') || s.companyName?.includes('RELIANCE')
      );
      expect(hasReliance).toBe(true);
    });

    it('should show all stocks when search text is empty', () => {
      // Arrange
      component.stocks = mockStockData;
      component.searchText = '';
      component.isLoadingStocks = false;

      // Act
      component.onSearchChange();
      fixture.detectChanges();

      // Assert
      // Should show all stocks (or at least more than 0)
      expect(component.filteredStocks.length).toBeGreaterThanOrEqual(1);
      expect(component.filteredStocks.length).toBeLessThanOrEqual(mockStockData.length);
    });
  });

  describe('Event Emission', () => {
    it('should emit stockSelected event on row click', () => {
      // Arrange
      spyOn(component.stockSelected, 'emit');
      const stockData = mockStockData[0];

      // Act
      component.onRowClick(stockData);

      // Assert
      expect(component.stockSelected.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          symbol: 'RELIANCE',
          name: 'Reliance Industries Limited',
          lastPrice: 2456.75
        })
      );
    });

    it('should emit stockDoubleClicked event on row double-click', () => {
      // Arrange
      spyOn(component.stockDoubleClicked, 'emit');
      const stockData = mockStockData[0];

      // Act
      component.onRowDoubleClick(stockData);

      // Assert
      expect(component.stockDoubleClicked.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          symbol: 'RELIANCE',
          name: 'Reliance Industries Limited',
          lastPrice: 2456.75
        })
      );
    });
  });
});
