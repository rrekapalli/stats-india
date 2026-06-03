import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { StatsApiService } from '../../services/stats-api.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, MenubarModule, ButtonModule, TagModule],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css'
})
export class AppHeaderComponent implements OnInit {
  private readonly api = inject(StatsApiService);

  readonly title = 'Stats India';
  readonly apiStatus = signal<'checking' | 'up' | 'down'>('checking');

  menuItems: MenuItem[] = [
    {
      label: 'Explorer',
      icon: 'pi pi-compass',
      routerLink: '/'
    },
    {
      label: 'Data Ingestion',
      icon: 'pi pi-download',
      routerLink: '/ingestion'
    },
    {
      label: 'Data Portal',
      icon: 'pi pi-external-link',
      url: 'https://data.gov.in',
      target: '_blank'
    }
  ];

  ngOnInit(): void {
    this.api.health().subscribe({
      next: () => this.apiStatus.set('up'),
      error: () => this.apiStatus.set('down')
    });
  }
}
