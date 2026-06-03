import {Component, Input, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IWidget} from '../../entities/IWidget';
import {IStockTileOptions} from './stock-tile-options';

@Component({
  selector: 'vis-stock-tile',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stock-tile.component.html',
  styleUrls: ['./stock-tile.component.scss']
})
export class StockTileComponent implements OnChanges {
  @Input() widget!: IWidget;
  @Input() onDataLoad!: EventEmitter<any>;
  @Input() onUpdateFilter!: EventEmitter<any>;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['widget'] && this.widget) {
      
      
      // Force change detection when widget data changes
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }

  get stockTileOptions(): IStockTileOptions {
    return this.widget?.config?.options as IStockTileOptions;
  }
} 