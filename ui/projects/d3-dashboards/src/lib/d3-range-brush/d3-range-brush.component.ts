import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { scaleLinear } from 'd3-scale';

type DragMode = 'start' | 'end' | 'span';

export type RangeBrushTuple = [number, number];

@Component({
  selector: 'lib-d3-range-brush',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './d3-range-brush.component.html',
  styleUrl: './d3-range-brush.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class D3RangeBrushComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) min = 0;
  @Input({ required: true }) max = 1;
  @Input() step = 0.01;
  @Input() range: RangeBrushTuple | null = null;
  @Input() disabled = false;
  @Input() formatValue: (n: number) => string = (n) => String(n);

  @Output() rangeChange = new EventEmitter<RangeBrushTuple>();
  @Output() rangeCommit = new EventEmitter<RangeBrushTuple>();

  @ViewChild('plot', { static: true }) plotRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly cdr = inject(ChangeDetectorRef);

  private resizeObserver?: ResizeObserver;
  private plotWidth = 0;
  private readonly plotHeight = 24;
  private readonly padX = 6;
  private readonly handleHalfW = 5;
  private readonly handleH = 14;
  private readonly trackH = 2;

  private lo = 0;
  private hi = 1;
  minInput = '';
  maxInput = '';
  private dragMode: DragMode | null = null;
  private dragStartX = 0;
  private dragStartLo = 0;
  private dragStartHi = 0;
  private boundPointerMove = (e: PointerEvent) => this.onPointerMove(e);
  private boundPointerUp = (e: PointerEvent) => this.onPointerUp(e);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['min'] || changes['max'] || changes['range']) {
      this.syncFromInputs();
      this.queuePaint();
    }
    if (changes['disabled']) {
      this.queuePaint();
    }
  }

  ngAfterViewInit(): void {
    this.syncFromInputs();
    this.resizeObserver = new ResizeObserver(() => {
      this.measureAndPaint();
    });
    this.resizeObserver.observe(this.plotRef.nativeElement);
    this.measureAndPaint();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);
    window.removeEventListener('pointercancel', this.boundPointerUp);
  }

  onMinInputBlur(): void {
    this.commitInput('min');
  }

  onMaxInputBlur(): void {
    this.commitInput('max');
  }

  onMinInputEnter(ev: Event): void {
    if ((ev as KeyboardEvent).key === 'Enter') {
      this.commitInput('min');
      (ev.target as HTMLInputElement).blur();
    }
  }

  onMaxInputEnter(ev: Event): void {
    if ((ev as KeyboardEvent).key === 'Enter') {
      this.commitInput('max');
      (ev.target as HTMLInputElement).blur();
    }
  }

  onCanvasPointerDown(ev: PointerEvent): void {
    if (this.disabled || this.plotWidth <= 0 || this.max <= this.min) {
      return;
    }
    const mode = this.hitTest(ev.offsetX);
    if (!mode) {
      return;
    }
    ev.preventDefault();
    this.canvasRef.nativeElement.setPointerCapture(ev.pointerId);
    this.dragMode = mode;
    this.dragStartX = ev.offsetX;
    this.dragStartLo = this.lo;
    this.dragStartHi = this.hi;
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);
    window.addEventListener('pointercancel', this.boundPointerUp);
  }

  private onPointerMove(ev: PointerEvent): void {
    if (!this.dragMode || this.disabled) {
      return;
    }
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const dx = x - this.dragStartX;
    const scale = this.valueScale();
    const dVal = (scale.invert(dx) as number) - (scale.invert(0) as number);

    let lo = this.dragStartLo;
    let hi = this.dragStartHi;
    if (this.dragMode === 'start') {
      lo = this.dragStartLo + dVal;
    } else if (this.dragMode === 'end') {
      hi = this.dragStartHi + dVal;
    } else {
      lo = this.dragStartLo + dVal;
      hi = this.dragStartHi + dVal;
    }
    this.applyRange(lo, hi, true);
  }

  private onPointerUp(_ev: PointerEvent): void {
    if (!this.dragMode) {
      return;
    }
    this.dragMode = null;
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);
    window.removeEventListener('pointercancel', this.boundPointerUp);
    try {
      this.canvasRef.nativeElement.releasePointerCapture(_ev.pointerId);
    } catch {
      /* already released */
    }
    this.rangeCommit.emit([this.lo, this.hi]);
    this.cdr.markForCheck();
  }

  private commitInput(which: 'min' | 'max'): void {
    const raw = which === 'min' ? this.minInput : this.maxInput;
    const parsed = Number.parseFloat(raw.replace(/,/g, ''));
    if (!Number.isFinite(parsed)) {
      this.syncInputLabels();
      return;
    }
    if (which === 'min') {
      this.applyRange(parsed, this.hi, true);
    } else {
      this.applyRange(this.lo, parsed, true);
    }
    this.rangeCommit.emit([this.lo, this.hi]);
  }

  private syncFromInputs(): void {
    const r = this.range;
    const lo = r?.[0] ?? this.min;
    const hi = r?.[1] ?? this.max;
    const clamped = this.clampRange(lo, hi);
    this.lo = clamped[0];
    this.hi = clamped[1];
    this.syncInputLabels();
  }

  private applyRange(lo: number, hi: number, emit: boolean): void {
    const next = this.clampRange(lo, hi);
    const changed = next[0] !== this.lo || next[1] !== this.hi;
    this.lo = next[0];
    this.hi = next[1];
    this.syncInputLabels();
    this.paint();
    if (emit && changed) {
      this.rangeChange.emit([this.lo, this.hi]);
    }
    this.cdr.markForCheck();
  }

  private clampRange(lo: number, hi: number): RangeBrushTuple {
    if (!Number.isFinite(this.min) || !Number.isFinite(this.max) || this.max <= this.min) {
      return [0, 1];
    }
    const step = this.step > 0 ? this.step : 0;
    const snap = (v: number) => {
      if (step <= 0) {
        return v;
      }
      const base = this.min;
      return base + Math.round((v - base) / step) * step;
    };
    let a = snap(Math.max(this.min, Math.min(this.max, lo)));
    let b = snap(Math.max(this.min, Math.min(this.max, hi)));
    if (a > b) {
      [a, b] = [b, a];
    }
    const minGap = step > 0 ? step : (this.max - this.min) / 400;
    if (b - a < minGap) {
      b = Math.min(this.max, a + minGap);
      if (b - a < minGap) {
        a = Math.max(this.min, b - minGap);
      }
    }
    return [a, b];
  }

  private syncInputLabels(): void {
    this.minInput = this.formatValue(this.lo);
    this.maxInput = this.formatValue(this.hi);
  }

  private valueScale() {
    const innerW = Math.max(1, this.plotWidth - this.padX * 2);
    return scaleLinear().domain([this.min, this.max]).range([this.padX, this.padX + innerW]);
  }

  private hitTest(x: number): DragMode | null {
    const scale = this.valueScale();
    const x0 = scale(this.lo);
    const x1 = scale(this.hi);
    if (Math.abs(x - x0) <= this.handleHalfW + 2) {
      return 'start';
    }
    if (Math.abs(x - x1) <= this.handleHalfW + 2) {
      return 'end';
    }
    if (x > x0 + this.handleHalfW && x < x1 - this.handleHalfW) {
      return 'span';
    }
    return null;
  }

  private measureAndPaint(): void {
    const w = Math.floor(this.plotRef.nativeElement.clientWidth);
    if (w !== this.plotWidth) {
      this.plotWidth = w;
    }
    this.paint();
  }

  private queuePaint(): void {
    queueMicrotask(() => this.measureAndPaint());
  }

  private paint(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx || this.plotWidth <= 0) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    const w = this.plotWidth;
    const h = this.plotHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const style = getComputedStyle(this.host.nativeElement);
    const trackColor =
      style.getPropertyValue('--d3-range-brush-track').trim() ||
      style.getPropertyValue('--p-text-muted-color').trim() ||
      '#94a3b8';
    const fillColor =
      style.getPropertyValue('--d3-range-brush-fill').trim() ||
      style.getPropertyValue('--p-primary-color').trim() ||
      '#6366f1';
    const handleColor =
      style.getPropertyValue('--d3-range-brush-handle').trim() ||
      style.getPropertyValue('--p-primary-color').trim() ||
      '#6366f1';
    const cy = h / 2;
    const innerW = Math.max(1, w - this.padX * 2);
    const x0 = this.padX;
    const x1 = this.padX + innerW;

    ctx.strokeStyle = trackColor;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = this.trackH;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, cy);
    ctx.lineTo(x1, cy);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (this.max > this.min && !this.disabled) {
      const scale = scaleLinear().domain([this.min, this.max]).range([x0, x1]);
      const hx0 = scale(this.lo);
      const hx1 = scale(this.hi);

      ctx.fillStyle = fillColor;
      ctx.globalAlpha = 0.22;
      ctx.fillRect(hx0, cy - this.trackH, Math.max(0, hx1 - hx0), this.trackH * 2);
      ctx.globalAlpha = 1;

      const drawHandle = (x: number) => {
        const hw = 3;
        const hh = this.handleH;
        ctx.fillStyle = handleColor;
        ctx.globalAlpha = 1;
        ctx.fillRect(x - hw / 2, cy - hh / 2, hw, hh);
        ctx.strokeStyle = style.getPropertyValue('--p-content-border-color').trim() || '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - hw / 2 + 0.5, cy - hh / 2 + 0.5, hw - 1, hh - 1);
      };
      drawHandle(hx0);
      drawHandle(hx1);
    }
  }
}
