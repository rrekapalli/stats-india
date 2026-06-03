import {Component, Input, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IWidget} from '../../entities/IWidget';
import {IMarkdownCellOptions} from '../../entities/IMarkdownCellOptions';

@Component({
  selector: 'vis-markdown-cell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="markdown-container">
      <div class="markdown-content" [innerHTML]="markdownContent"></div>
    </div>
  `,
  styles: [`
    .markdown-container {
      padding: 1rem;
      height: 100%;
      overflow-y: auto;
    }
    .markdown-content {
      line-height: 1.6;
      color: #374151;
    }
    .markdown-content h1,
    .markdown-content h2,
    .markdown-content h3,
    .markdown-content h4,
    .markdown-content h5,
    .markdown-content h6 {
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #111827;
    }
    .markdown-content h1 { font-size: 1.875rem; }
    .markdown-content h2 { font-size: 1.5rem; }
    .markdown-content h3 { font-size: 1.25rem; }
    .markdown-content p {
      margin-bottom: 1rem;
    }
    .markdown-content ul,
    .markdown-content ol {
      margin-bottom: 1rem;
      padding-left: 1.5rem;
    }
    .markdown-content li {
      margin-bottom: 0.25rem;
    }
    .markdown-content code {
      background-color: #f3f4f6;
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
    }
    .markdown-content pre {
      background-color: #f3f4f6;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin-bottom: 1rem;
    }
    .markdown-content blockquote {
      border-left: 4px solid #d1d5db;
      padding-left: 1rem;
      margin: 1rem 0;
      font-style: italic;
      color: #6b7280;
    }
  `]
})
export class MarkdownCellComponent {
  @Input() widget!: IWidget;
  @Input() onDataLoad!: EventEmitter<any>;
  @Input() onUpdateFilter!: EventEmitter<any>;

  get markdownOptions(): IMarkdownCellOptions {
    return this.widget?.config?.options as IMarkdownCellOptions;
  }

  get markdownContent(): string {
    // Basic markdown to HTML conversion (simplified)
    // In a real implementation, you might want to use a proper markdown parser
    return this.markdownOptions?.content || '';
  }
}
