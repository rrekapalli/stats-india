import {Component, Input, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IWidget} from '../../entities/IWidget';
import {ICodeCellOptions} from '../../entities/ICodeCellOptions';

@Component({
  selector: 'vis-code-cell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="code-container">
      <div class="code-header">
        <span class="code-language">{{ codeLanguage }}</span>
        <button class="copy-button" (click)="copyCode()" title="Copy code">
          <i class="fas fa-copy"></i>
        </button>
      </div>
      <pre class="code-content"><code>{{ codeContent }}</code></pre>
    </div>
  `,
  styles: [`
    .code-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: #1f2937;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background-color: #374151;
      border-bottom: 1px solid #4b5563;
    }
    .code-language {
      color: #d1d5db;
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
    }
    .copy-button {
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 0.25rem;
      transition: color 0.2s;
    }
    .copy-button:hover {
      color: #d1d5db;
      background-color: #4b5563;
    }
    .code-content {
      flex: 1;
      margin: 0;
      padding: 1rem;
      overflow: auto;
      font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      color: #e5e7eb;
      background-color: #1f2937;
    }
    .code-content code {
      background: none;
      padding: 0;
      border-radius: 0;
      font-family: inherit;
      font-size: inherit;
      color: inherit;
    }
  `]
})
export class CodeCellComponent {
  @Input() widget!: IWidget;
  @Input() onDataLoad!: EventEmitter<any>;
  @Input() onUpdateFilter!: EventEmitter<any>;

  get codeOptions(): ICodeCellOptions {
    return this.widget?.config?.options as ICodeCellOptions;
  }

  get codeContent(): string {
    // In a real implementation, this would come from the widget data
    return this.widget?.data || '// Code content will be displayed here';
  }

  get codeLanguage(): string {
    // Determine language from file extension or configuration
    const accessor = this.codeOptions?.accessor || '';
    if (accessor.endsWith('.ts')) return 'typescript';
    if (accessor.endsWith('.js')) return 'javascript';
    if (accessor.endsWith('.py')) return 'python';
    if (accessor.endsWith('.java')) return 'java';
    if (accessor.endsWith('.cpp')) return 'cpp';
    if (accessor.endsWith('.cs')) return 'csharp';
    return 'text';
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.codeContent).then(() => {
      // TODO: Add toast notification for successful copy
    }).catch(err => {
      // TODO: Add error handling for copy failure
    });
  }
}
