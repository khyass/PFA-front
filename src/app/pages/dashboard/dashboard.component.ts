import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobOfferService } from '../../core/services/job-offer.service';
import { AuthService } from '../../core/services/auth.service';
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
  private readonly authService = inject(AuthService);

  protected readonly jobOffers = signal<JobOfferResponseDTO[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly selectedJobId = signal<string | null>(null);
  protected readonly candidatures = signal<CandidatureDTO[]>([]);

  ngOnInit(): void {
    this.loadJobOffers();
  }

  loadJobOffers(): void {
    this.isLoading.set(true);
    const profile = this.authService.getUserProfile();
    const ownerId = profile?.id;
    this.jobOfferService.getAllJobOffers(0, 50, undefined, undefined, 'publishedDate', 'desc', ownerId).subscribe({
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
      open: offers.filter(offer => offer.status === JobOfferStatus.OPEN).length,
      draft: offers.filter(offer => offer.status === JobOfferStatus.DRAFT).length,
      closed: offers.filter(offer => offer.status === JobOfferStatus.CLOSED).length,
      totalCandidatures: offers.reduce((sum, offer) => sum + (offer.candidatureCount || 0), 0)
    };
  });

  protected readonly recentOffers = computed(() => {
    return [...this.jobOffers()]
      .sort((a, b) => new Date(b.publishedDate || b.createdAt).getTime() - new Date(a.publishedDate || a.createdAt).getTime())
      .slice(0, 5);
  });

  getStatusBadgeClass(status: JobOfferStatus): string {
    const classes: Record<JobOfferStatus, string> = {
      [JobOfferStatus.DRAFT]: 'badge-info',
      [JobOfferStatus.OPEN]: 'badge-success',
      [JobOfferStatus.CLOSED]: 'badge-warning'
    };
    return classes[status] || 'badge-info';
  }

  getStatusLabel(status: JobOfferStatus): string {
    const labels: Record<JobOfferStatus, string> = {
      [JobOfferStatus.DRAFT]: 'Brouillon',
      [JobOfferStatus.OPEN]: 'Ouverte',
      [JobOfferStatus.CLOSED]: 'Fermée'
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

  deleteJobOffer(jobId: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      this.jobOfferService.deleteJobOffer(jobId).subscribe({
        next: () => {
          this.loadJobOffers();
        },
        error: (error) => {
          console.error('Error deleting job offer:', error);
          alert('Erreur lors de la suppression de l\'offre.');
        }
      });
    }
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  }
}
