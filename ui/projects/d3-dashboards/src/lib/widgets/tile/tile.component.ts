import {Component, Input, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IWidget} from '../../entities/IWidget';
import {ITileOptions} from '../../entities/ITileOptions';

@Component({
  selector: 'vis-tile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tile-container" 
         [style.background-color]="tileOptions.backgroundColor || tileOptions.color"
         [style.opacity]="tileOptions.backgroundOpacity || 1">
      <div class="tile-content">
        <div class="tile-left">
          <div class="tile-value" [style.color]="tileOptions.color">{{ tileOptions.value }}</div>
          <div class="tile-description" [style.color]="tileOptions.color">{{ tileOptions.description }}</div>
          <div class="tile-subtitle" [style.color]="tileOptions.color" *ngIf="tileOptions.subtitle">{{ tileOptions.subtitle }}</div>
        </div>
        <div class="tile-right">
          <div class="tile-change" [class]="'change-' + tileOptions.changeType" [style.color]="tileOptions.color">
            {{ tileOptions.change }}
          </div>
          <div class="tile-icon" [style.color]="tileOptions.color">
            <i [class]="tileOptions.icon"></i>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tile-container {
      padding: 1.5rem;
      border-radius: 0.5rem;
      color: white;
      height: 100%;
      display: flex;
      align-items: center;
      min-height: 120px;
    }
    .tile-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 1rem;
    }
    .tile-left {
      flex: 1;
    }
    .tile-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }
    .tile-value {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .tile-description {
      font-size: 1.2rem;
      opacity: 0.8;
    }
    .tile-subtitle {
      font-size: 0.875rem;
      opacity: 0.7;
      margin-top: 0.25rem;
    }
    .tile-change {
      font-size: 0.875rem;
      font-weight: 500;
      color: white;
    }
    .tile-icon {
      font-size: 1.5rem;
      opacity: 0.9;
      color: white;
    }
    .change-positive {
      color: #10b981 !important;
    }
    .change-negative {
      color: #ef4444 !important;
    }
    .change-neutral {
      color: #6b7280 !important;
    }
  `]
})
export class TileComponent {
  @Input() widget!: IWidget;
  @Input() onDataLoad!: EventEmitter<any>;
  @Input() onUpdateFilter!: EventEmitter<any>;

  get tileOptions(): ITileOptions {
    return this.widget?.config?.options as ITileOptions;
  }
}
