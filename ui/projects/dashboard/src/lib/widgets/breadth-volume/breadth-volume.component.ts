import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-breadth-volume',
  standalone: true,
  imports: [CommonModule],
  template: `<div [attr.aria-label]="ariaLabel">Up: {{ upVolume }} / Down: {{ downVolume }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadthVolumeComponent {
  @Input() upVolume = 0;
  @Input() downVolume = 0;
  @Input() ariaLabel = 'Volume breadth';
}
