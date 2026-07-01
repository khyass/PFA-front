import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { JobOfferService } from '../../core/services/job-offer.service';
import { JobOfferResponseDTO, JobOfferStatus } from '../../core/models/job-offer.models';
import { CandidatureDTO, CandidatureStatus } from '../../core/models/candidature.models';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly jobOfferService = inject(JobOfferService);

  protected readonly loading = signal(true);
  protected readonly isEnterprise = signal(false);

  // Enterprise stats
  protected readonly jobOffers = signal<JobOfferResponseDTO[]>([]);
  protected readonly allCandidatures = signal<CandidatureDTO[]>([]);

  protected readonly totalOffers = computed(() => this.jobOffers().length);
  protected readonly openOffers = computed(() => this.jobOffers().filter(j => j.status === JobOfferStatus.OPEN).length);
  protected readonly closedOffers = computed(() => this.jobOffers().filter(j => j.status === JobOfferStatus.CLOSED).length);
  protected readonly draftOffers = computed(() => this.jobOffers().filter(j => j.status === JobOfferStatus.DRAFT).length);

  protected readonly totalCandidatures = computed(() => this.allCandidatures().length);
  protected readonly candidaturesByStatus = computed(() => {
    const candidatures = this.allCandidatures();
    return {
      pending: candidatures.filter(c => c.status === CandidatureStatus.PENDING).length,
      reviewing: candidatures.filter(c => c.status === CandidatureStatus.REVIEWING).length,
      interview: candidatures.filter(c => c.status === CandidatureStatus.INTERVIEW).length,
      offer: candidatures.filter(c => c.status === CandidatureStatus.OFFER).length,
      hired: candidatures.filter(c => c.status === CandidatureStatus.HIRED).length,
      rejected: candidatures.filter(c => c.status === CandidatureStatus.REJECTED).length,
      accepted: candidatures.filter(c => c.status === CandidatureStatus.ACCEPTED).length,
    };
  });

  protected readonly hireRate = computed(() => {
    const total = this.totalCandidatures();
    if (total === 0) return 0;
    const hired = this.candidaturesByStatus().hired + this.candidaturesByStatus().accepted;
    return Math.round((hired / total) * 100);
  });

  protected readonly interviewRate = computed(() => {
    const total = this.totalCandidatures();
    if (total === 0) return 0;
    const interviewed = this.candidaturesByStatus().interview + this.candidaturesByStatus().offer + this.candidaturesByStatus().hired + this.candidaturesByStatus().accepted;
    return Math.round((interviewed / total) * 100);
  });

  protected readonly topOffers = computed(() => {
    return [...this.jobOffers()]
      .sort((a, b) => (b.candidatureCount || 0) - (a.candidatureCount || 0))
      .slice(0, 5);
  });

  protected readonly maxCandidatureCount = computed(() => {
    const max = Math.max(...this.topOffers().map(o => o.candidatureCount || 0), 1);
    return max;
  });

  protected readonly candidaturesPerOffer = computed(() => {
    const total = this.totalOffers();
    if (total === 0) return 0;
    return Math.round((this.totalCandidatures() / total) * 10) / 10;
  });

  // Candidatures by month for enterprise
  protected readonly monthlyData = computed(() => {
    const candidatures = this.allCandidatures();
    const months: { [key: string]: number } = {};
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    candidatures.forEach(c => {
      if (c.appliedDate) {
        const date = new Date(c.appliedDate);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        months[key] = (months[key] || 0) + 1;
      }
    });

    // Get last 6 months
    const result: { month: string; applications: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      result.push({ month: monthNames[d.getMonth()], applications: months[key] || 0 });
    }
    return result;
  });

  protected readonly maxApplications = computed(() => {
    return Math.max(...this.monthlyData().map(d => d.applications), 1);
  });

  ngOnInit(): void {
    this.isEnterprise.set(this.authService.isEnterprise());
    if (this.isEnterprise()) {
      this.loadEnterpriseStats();
    } else {
      this.loading.set(false);
    }
  }

  private loadEnterpriseStats(): void {
    const userId = this.authService.getUserProfile()?.id;
    if (!userId) {
      this.loading.set(false);
      return;
    }

    this.jobOfferService.getAllJobOffers(0, 100, undefined, undefined, 'createdAt', 'desc', userId).subscribe({
      next: (page) => {
        this.jobOffers.set(page.content);
        this.loadAllCandidatures(page.content);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadAllCandidatures(offers: JobOfferResponseDTO[]): void {
    if (offers.length === 0) {
      this.loading.set(false);
      return;
    }

    const requests = offers
      .filter(o => (o.candidatureCount || 0) > 0)
      .map(o => this.jobOfferService.getCandidaturesForJobOffer(o.id));

    if (requests.length === 0) {
      this.loading.set(false);
      return;
    }

    forkJoin(requests).subscribe({
      next: (results) => {
        const all = results.flat();
        this.allCandidatures.set(all);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getBarHeight(count: number): string {
    return `${(count / this.maxApplications()) * 100}%`;
  }

  getStatusBarWidth(count: number): string {
    const total = this.totalCandidatures();
    if (total === 0) return '0%';
    return `${(count / total) * 100}%`;
  }
}
