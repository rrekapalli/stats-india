import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Stats India';
  stats = [
    { label: 'Population', value: '1.4B+' },
    { label: 'States', value: '28' },
    { label: 'UTs', value: '8' }
  ];
}
