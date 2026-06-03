import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from '../header/app-header.component';
import { AppFooterComponent } from '../footer/app-footer.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, AppHeaderComponent, AppFooterComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css'
})
export class AppShellComponent {}
