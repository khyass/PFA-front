import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobOfferService } from '../../core/services/job-offer.service';
import { JobOfferResponseDTO, JobOfferStatus } from '../../core/models/job-offer.models';
import { CandidatureDTO } from '../../core/models/candidature.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private readonly jobOfferService = inject(JobOfferService);

  protected readonly jobOffers = signal<JobOfferResponseDTO[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly selectedJobId = signal<string | null>(null);
  protected readonly candidatures = signal<CandidatureDTO[]>([]);

  ngOnInit(): void {
    this.loadJobOffers();
  }

  loadJobOffers(): void {
    this.isLoading.set(true);
    this.jobOfferService.getAllJobOffers(0, 50).subscribe({
      next: (page) => {
        this.jobOffers.set(page.content);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading job offers:', error);
        this.isLoading.set(false);
      }
    });
  }

  loadCandidatures(jobId: string): void {
    this.selectedJobId.set(jobId);
    this.jobOfferService.getCandidaturesForJobOffer(jobId).subscribe({
      next: (candidatures) => {
        this.candidatures.set(candidatures);
      },
      error: (error) => {
        console.error('Error loading candidatures:', error);
      }
    });
  }

  protected readonly stats = computed(() => {
    const offers = this.jobOffers();
    return {
      total: offers.length,
      published: offers.filter(offer => offer.status === JobOfferStatus.PUBLISHED).length,
      draft: offers.filter(offer => offer.status === JobOfferStatus.DRAFT).length,
      closed: offers.filter(offer => offer.status === JobOfferStatus.CLOSED).length,
      totalCandidatures: offers.reduce((sum, offer) => sum + (offer.candidatureCount || 0), 0)
    };
  });

  protected readonly recentOffers = computed(() => {
    return [...this.jobOffers()]
      .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
      .slice(0, 5);
  });

  getStatusBadgeClass(status: JobOfferStatus): string {
    const classes: Record<JobOfferStatus, string> = {
      [JobOfferStatus.DRAFT]: 'badge-info',
      [JobOfferStatus.PUBLISHED]: 'badge-success',
      [JobOfferStatus.CLOSED]: 'badge-warning',
      [JobOfferStatus.ARCHIVED]: 'badge-error'
    };
    return classes[status] || 'badge-info';
  }

  getStatusLabel(status: JobOfferStatus): string {
    const labels: Record<JobOfferStatus, string> = {
      [JobOfferStatus.DRAFT]: 'Brouillon',
      [JobOfferStatus.PUBLISHED]: 'Publiée',
      [JobOfferStatus.CLOSED]: 'Fermée',
      [JobOfferStatus.ARCHIVED]: 'Archivée'
    };
    return labels[status] || status;
  }

  updateJobStatus(jobId: string, newStatus: JobOfferStatus): void {
    this.jobOfferService.updateJobOfferStatus(jobId, newStatus).subscribe({
      next: () => {
        this.loadJobOffers();
      },
      error: (error) => {
        console.error('Error updating job status:', error);
        alert('Erreur lors de la mise à jour du statut');
      }
    });
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  }
}
