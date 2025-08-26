import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarModule } from 'primeng/toolbar';
import { MenubarModule } from 'primeng/menubar';
import { MenuModule } from 'primeng/menu';
import { PanelModule } from 'primeng/panel';
import { CardModule } from 'primeng/card';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ToolbarModule, MenubarModule, MenuModule, PanelModule, CardModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Stats India';

  activeView: 'overview' | 'data' = 'overview';

  topMenuItems: MenuItem[] = [
    { label: 'Overview', command: () => (this.activeView = 'overview') },
    { label: 'Data', command: () => (this.activeView = 'data') }
  ];

  sideNavItems: MenuItem[] = [
    { label: 'Overview', icon: 'pi pi-home', command: () => (this.activeView = 'overview') },
    { label: 'Data', icon: 'pi pi-database', command: () => (this.activeView = 'data') }
  ];

  // Sample content for Overview
  stats = [
    { label: 'Population', value: '1.4B+' },
    { label: 'States', value: '28' },
    { label: 'UTs', value: '8' }
  ];
}
