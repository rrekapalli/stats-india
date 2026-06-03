import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

// Import filter interfaces
export interface FilterOptions {
  indices: string[];
}

export interface InstrumentFilter {
  index?: string;
}

@Component({
  selector: 'vis-dashboard-header',
  standalone: true,
  imports: [
    CommonModule,
    SelectModule,
    FormsModule,
  ],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.css'],
})
export class DashboardHeaderComponent implements OnInit, OnChanges {
  @Input() title: string = 'Dashboard';
  
  // Instrument filter inputs
  @Input() showInstrumentFilters: boolean = false;
  @Input() filterOptions: FilterOptions = { indices: [] };
  @Input() selectedFilters: InstrumentFilter = {};
  @Input() isLoadingFilters: boolean = false;

  @Output() onFilterChange = new EventEmitter<InstrumentFilter>();

  ngOnChanges(changes: SimpleChanges): void {
    // Component changes handling if needed
  }

  ngOnInit(): void {
    // Component initialization if needed
  }



  // Instrument filter change handlers
  onIndexChange(value: string) {
    const updatedFilters: InstrumentFilter = {
      ...this.selectedFilters,
      index: value
    };
    this.onFilterChange.emit(updatedFilters);
  }
} 
