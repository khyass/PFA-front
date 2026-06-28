import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { JobOfferService } from '../../core/services/job-offer.service';
import { CandidatureService } from '../../core/services/candidature.service';
import { AuthService } from '../../core/services/auth.service';
import { JobOfferResponseDTO, JobOfferStatus } from '../../core/models/job-offer.models';
import { CandidatureDTO, CandidatureStatus } from '../../core/models/candidature.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private readonly jobOfferService = inject(JobOfferService);
  private readonly candidatureService = inject(CandidatureService);
  private readonly authService = inject(AuthService);

  protected readonly jobOffers = signal<JobOfferResponseDTO[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly selectedJobId = signal<string | null>(null);
  protected readonly candidatures = signal<CandidatureDTO[]>([]);
  protected readonly isLoadingCandidatures = signal(false);
  protected readonly statusDropdownId = signal<string | null>(null);
  protected readonly showAllCandidatures = signal(false);

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
    this.isLoadingCandidatures.set(true);
    this.jobOfferService.getCandidaturesForJobOffer(jobId).subscribe({
      next: (candidatures) => {
        this.candidatures.set(candidatures);
        this.isLoadingCandidatures.set(false);
      },
      error: (error) => {
        console.error('Error loading candidatures:', error);
        this.isLoadingCandidatures.set(false);
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

  closeCandidatures(): void {
    this.selectedJobId.set(null);
    this.candidatures.set([]);
    this.statusDropdownId.set(null);
    this.showAllCandidatures.set(false);
  }

  toggleStatusDropdown(id: string, event: Event): void {
    event.stopPropagation();
    this.statusDropdownId.set(this.statusDropdownId() === id ? null : id);
  }

  getCandidatureStatusLabel(status: CandidatureStatus): string {
    const labels: Record<CandidatureStatus, string> = {
      [CandidatureStatus.PENDING]: 'En attente',
      [CandidatureStatus.REVIEWING]: 'En cours',
      [CandidatureStatus.ACCEPTED]: 'Acceptée',
      [CandidatureStatus.REJECTED]: 'Refusée'
    };
    return labels[status] || status;
  }

  getCandidatureStatusClass(status: CandidatureStatus): string {
    const classes: Record<CandidatureStatus, string> = {
      [CandidatureStatus.PENDING]: 'cand-badge-pending',
      [CandidatureStatus.REVIEWING]: 'cand-badge-reviewing',
      [CandidatureStatus.ACCEPTED]: 'cand-badge-accepted',
      [CandidatureStatus.REJECTED]: 'cand-badge-rejected'
    };
    return classes[status] || 'cand-badge-pending';
  }

  updateCandidatureStatus(candidatureId: string, newStatus: string): void {
    this.statusDropdownId.set(null);
    this.candidatureService.updateCandidatureStatus(candidatureId, newStatus).subscribe({
      next: () => {
        if (this.showAllCandidatures()) {
          this.loadAllCandidatures();
        } else if (this.selectedJobId()) {
          this.loadCandidatures(this.selectedJobId()!);
        }
      },
      error: () => {
        console.error('Error updating candidature status');
        alert('Erreur lors de la mise à jour du statut de la candidature.');
      }
    });
  }

  loadAllCandidatures(): void {
    const offers = this.jobOffers();
    if (offers.length === 0) return;

    this.showAllCandidatures.set(true);
    this.selectedJobId.set('all');
    this.isLoadingCandidatures.set(true);

    const requests = offers.map(o => this.jobOfferService.getCandidaturesForJobOffer(o.id));
    forkJoin(requests).subscribe({
      next: (results) => {
        const all = results.flat();
        this.candidatures.set(all);
        this.isLoadingCandidatures.set(false);
      },
      error: (error) => {
        console.error('Error loading all candidatures:', error);
        this.isLoadingCandidatures.set(false);
      }
    });
  }
}
