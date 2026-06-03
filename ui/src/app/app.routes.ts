import { Routes } from '@angular/router';
import { AppShellComponent } from './core/shell/app-shell.component';
import { ExplorerComponent } from './features/explorer/explorer.component';
import { DataIngestionComponent } from './features/data-ingestion/data-ingestion.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', component: ExplorerComponent },
      { path: 'ingestion', component: DataIngestionComponent },
      { path: '**', redirectTo: '' }
    ]
  }
];
