import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { JobOfferService } from '../../core/services/job-offer.service';
import { CandidatureService } from '../../core/services/candidature.service';
import { AuthService } from '../../core/services/auth.service';
import { JobOfferResponseDTO, JobOfferStatus } from '../../core/models/job-offer.models';
import { CandidatureDTO, CandidatureStatus } from '../../core/models/candidature.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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

  // Interview scheduling modal
  protected readonly showInterviewModal = signal(false);
  protected readonly interviewCandidatureId = signal<string | null>(null);
  protected readonly interviewConflict = signal<string | null>(null);
  protected interviewDate = '';
  protected interviewNotes = '';

  // Get all scheduled interviews across all candidatures
  protected readonly scheduledInterviews = computed(() => {
    return this.candidatures()
      .filter(c => c.interviewDate && c.status === CandidatureStatus.INTERVIEW)
      .map(c => ({
        candidateName: c.candidateName || c.candidateId || 'Candidat',
        date: c.interviewDate!,
      }));
  });

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
      [CandidatureStatus.REVIEWING]: 'En revue',
      [CandidatureStatus.INTERVIEW]: 'Entretien',
      [CandidatureStatus.OFFER]: 'Offre',
      [CandidatureStatus.HIRED]: 'Embauché',
      [CandidatureStatus.ACCEPTED]: 'Acceptée',
      [CandidatureStatus.REJECTED]: 'Refusée'
    };
    return labels[status] || status;
  }

  getCandidatureStatusClass(status: CandidatureStatus): string {
    const classes: Record<CandidatureStatus, string> = {
      [CandidatureStatus.PENDING]: 'cand-badge-pending',
      [CandidatureStatus.REVIEWING]: 'cand-badge-reviewing',
      [CandidatureStatus.INTERVIEW]: 'cand-badge-interview',
      [CandidatureStatus.OFFER]: 'cand-badge-offer',
      [CandidatureStatus.HIRED]: 'cand-badge-hired',
      [CandidatureStatus.ACCEPTED]: 'cand-badge-accepted',
      [CandidatureStatus.REJECTED]: 'cand-badge-rejected'
    };
    return classes[status] || 'cand-badge-pending';
  }

  updateCandidatureStatus(candidatureId: string, newStatus: string): void {
    this.statusDropdownId.set(null);

    // If moving to INTERVIEW, open the scheduling modal
    if (newStatus === 'INTERVIEW') {
      this.interviewCandidatureId.set(candidatureId);
      this.interviewDate = '';
      this.interviewNotes = '';
      this.interviewConflict.set(null);
      this.showInterviewModal.set(true);
      return;
    }

    this.candidatureService.updateCandidatureStatus(candidatureId, newStatus).subscribe({
      next: () => this.refreshCandidatures(),
      error: () => {
        console.error('Error updating candidature status');
        alert('Erreur lors de la mise à jour du statut de la candidature.');
      }
    });
  }

  checkInterviewConflict(): void {
    if (!this.interviewDate) {
      this.interviewConflict.set(null);
      return;
    }

    const newDate = new Date(this.interviewDate);
    const conflict = this.scheduledInterviews().find(interview => {
      const existingDate = new Date(interview.date);
      // Consider conflict if within 1 hour window
      const diffMs = Math.abs(newDate.getTime() - existingDate.getTime());
      return diffMs < 60 * 60 * 1000; // 1 hour
    });

    if (conflict) {
      const conflictDate = new Date(conflict.date);
      const formattedDate = conflictDate.toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      this.interviewConflict.set(
        `⚠️ Conflit : un entretien avec "${conflict.candidateName}" est déjà prévu le ${formattedDate}`
      );
    } else {
      this.interviewConflict.set(null);
    }
  }

  confirmInterview(): void {
    const id = this.interviewCandidatureId();
    if (!id || !this.interviewDate) return;

    // Block if there's a conflict
    if (this.interviewConflict()) {
      return;
    }

    this.candidatureService.updateCandidatureStatus(
      id, 'INTERVIEW', undefined, this.interviewDate || undefined, this.interviewNotes || undefined
    ).subscribe({
      next: () => {
        this.showInterviewModal.set(false);
        this.interviewCandidatureId.set(null);
        this.interviewConflict.set(null);
        this.refreshCandidatures();
      },
      error: () => {
        alert('Erreur lors de la planification de l\'entretien.');
      }
    });
  }

  cancelInterviewModal(): void {
    this.showInterviewModal.set(false);
    this.interviewCandidatureId.set(null);
  }

  getCandidaturesByStatus(status: CandidatureStatus): CandidatureDTO[] {
    return this.candidatures().filter(c => c.status === status);
  }

  private refreshCandidatures(): void {
    if (this.showAllCandidatures()) {
      this.loadAllCandidatures();
    } else if (this.selectedJobId()) {
      this.loadCandidatures(this.selectedJobId()!);
    }
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
