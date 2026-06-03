import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, ContentChild, TemplateRef, input, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { MT_ACTION_DIALOG_STYLE_CLASS } from './mt-action-dialog.constants';

/**
 * Opinionated PrimeNG `p-dialog` wrapper: header title, optional icon + projected body,
 * and a footer from `<ng-template #mtActionDialogFooter>`.
 */
@Component({
  selector: 'lib-mt-action-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, NgTemplateOutlet],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="modal()"
      [draggable]="draggable()"
      [dismissableMask]="dismissableMask()"
      [closable]="closable()"
      [appendTo]="appendTo()"
      [style]="dialogStyle()"
      [styleClass]="dialogStyleClass()"
      [closeOnEscape]="closeOnEscape()"
    >
      <ng-template pTemplate="header">
        <span class="mt-action-dialog__title">{{ title() }}</span>
      </ng-template>
      @if (iconClass()) {
        <div class="mt-action-dialog__body">
          <i [class]="iconClass() + ' mt-action-dialog__icon'" aria-hidden="true"></i>
          <div class="mt-action-dialog__body-main">
            <ng-content></ng-content>
          </div>
        </div>
      } @else {
        <ng-content></ng-content>
      }
      <ng-template pTemplate="footer">
        @if (footerTpl) {
          <ng-container *ngTemplateOutlet="footerTpl"></ng-container>
        }
      </ng-template>
    </p-dialog>
  `
})
export class MtActionDialogComponent {
  @ContentChild('mtActionDialogFooter', { read: TemplateRef }) footerTpl?: TemplateRef<unknown>;

  readonly visible = model(false);
  readonly title = input.required<string>();
  readonly width = input('min(26rem, 92vw)');
  readonly modal = input(true);
  readonly draggable = input(false);
  readonly dismissableMask = input(true);
  readonly closable = input(true);
  readonly closeOnEscape = input(true);
  readonly appendTo = input<string | HTMLElement>('body');
  readonly iconClass = input<string | undefined>(undefined);
  /** Extra classes merged after `mt-action-dialog` (e.g. `account-dialog`). */
  readonly extraStyleClass = input('');

  protected dialogStyle(): Record<string, string> {
    return { width: this.width() };
  }

  protected dialogStyleClass(): string {
    const extra = this.extraStyleClass().trim();
    const base = MT_ACTION_DIALOG_STYLE_CLASS;
    return extra ? `${base} ${extra}` : base;
  }
}
