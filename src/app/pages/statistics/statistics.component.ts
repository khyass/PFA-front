import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent {
  protected readonly stats = signal({
    total: 42,
    applied: 18,
    interview: 12,
    offer: 6,
    rejected: 6,
    successRate: 43,
    averageResponseTime: 7
  });

  protected readonly monthlyData = signal([
    { month: 'Jan', applications: 8 },
    { month: 'Fév', applications: 12 },
    { month: 'Mar', applications: 10 },
    { month: 'Avr', applications: 12 }
  ]);

  protected readonly topCompanies = signal([
    { name: 'Google', count: 3 },
    { name: 'Microsoft', count: 3 },
    { name: 'Amazon', count: 2 },
    { name: 'Meta', count: 2 },
    { name: 'Apple', count: 1 }
  ]);

  protected readonly maxApplications = computed(() => {
    return Math.max(...this.monthlyData().map(d => d.applications));
  });

  getBarHeight(count: number): string {
    return `${(count / this.maxApplications()) * 100}%`;
  }
}
