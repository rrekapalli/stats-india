import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { DatePipe } from '@angular/common';

import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { HomeComponent } from './components/home/home.component';
import { StatisticsListComponent } from './components/statistics-list/statistics-list.component';
import { StatisticDetailComponent } from './components/statistic-detail/statistic-detail.component';
import { StatisticFormComponent } from './components/statistic-form/statistic-form.component';
import { StatisticService } from './services/statistic.service';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'statistics', component: StatisticsListComponent },
  { path: 'statistics/:id', component: StatisticDetailComponent },
  { path: 'add', component: StatisticFormComponent },
  { path: 'edit/:id', component: StatisticFormComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    StatisticsListComponent,
    StatisticDetailComponent,
    StatisticFormComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    StatisticService,
    DatePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
