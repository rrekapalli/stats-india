import { Routes } from '@angular/router';
import { AppShellComponent } from './core/shell/app-shell.component';
import { ExplorerComponent } from './features/explorer/explorer.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', component: ExplorerComponent },
      { path: '**', redirectTo: '' }
    ]
  }
];
