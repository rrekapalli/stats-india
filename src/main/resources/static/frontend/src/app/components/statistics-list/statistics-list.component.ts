import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Statistic } from '../../models/statistic.model';
import { StatisticService } from '../../services/statistic.service';

@Component({
  selector: 'app-statistics-list',
  templateUrl: './statistics-list.component.html',
  styleUrls: ['./statistics-list.component.scss']
})
export class StatisticsListComponent implements OnInit {
  statistics: Statistic[] = [];
  loading = false;
  error = '';
  filterCategory = '';
  filterState = '';
  filterMetric = '';

  constructor(
    private statisticService: StatisticService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loading = true;
    
    // Check for query parameters
    this.route.queryParams.subscribe(params => {
      this.filterCategory = params['category'] || '';
      this.filterState = params['state'] || '';
      this.filterMetric = params['metric'] || '';
      
      this.loadStatistics();
    });
  }

  loadStatistics(): void {
    this.loading = true;
    
    // Apply filters if present
    if (this.filterCategory && this.filterState) {
      this.statisticService.getStatisticsByCategoryAndState(this.filterCategory, this.filterState)
        .subscribe(this.handleResponse.bind(this));
    } else if (this.filterCategory) {
      this.statisticService.getStatisticsByCategory(this.filterCategory)
        .subscribe(this.handleResponse.bind(this));
    } else if (this.filterState) {
      this.statisticService.getStatisticsByState(this.filterState)
        .subscribe(this.handleResponse.bind(this));
    } else if (this.filterMetric) {
      this.statisticService.getStatisticsByMetric(this.filterMetric)
        .subscribe(this.handleResponse.bind(this));
    } else {
      this.statisticService.getAllStatistics()
        .subscribe(this.handleResponse.bind(this));
    }
  }

  private handleResponse(data: Statistic[]): void {
    this.statistics = data;
    this.loading = false;
    this.error = '';
  }

  clearFilters(): void {
    this.filterCategory = '';
    this.filterState = '';
    this.filterMetric = '';
    this.loadStatistics();
  }

  deleteStatistic(id: number): void {
    if (confirm('Are you sure you want to delete this statistic?')) {
      this.statisticService.deleteStatistic(id).subscribe({
        next: () => {
          this.statistics = this.statistics.filter(stat => stat.id !== id);
        },
        error: (err) => {
          this.error = 'Failed to delete the statistic. Please try again.';
          console.error(err);
        }
      });
    }
  }
}