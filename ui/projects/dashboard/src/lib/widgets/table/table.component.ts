import {Component, Input, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IWidget} from '../../entities/IWidget';
import {ITableOptions} from '../../entities/ITableOptions';

@Component({
  selector: 'vis-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th *ngFor="let column of tableOptions.columns">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of tableOptions.data">
            <td *ngFor="let column of tableOptions.columns">{{ row[column] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      padding: 1rem;
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .data-table th,
    .data-table td {
      padding: 0.5rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .data-table th {
      background-color: #f9fafb;
      font-weight: 600;
    }
    .data-table tr:hover {
      background-color: #f9fafb;
    }
  `]
})
export class TableComponent {
  @Input() widget!: IWidget;
  @Input() onDataLoad!: EventEmitter<any>;
  @Input() onUpdateFilter!: EventEmitter<any>;

  get tableOptions(): ITableOptions {
    return this.widget?.config?.options as ITableOptions;
  }
}
