import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CandidatureService } from '../../core/services/candidature.service';
import { CandidatureResponseDTO, CandidatureStatus } from '../../core/models/candidature.models';

@Component({
  selector: 'app-jobs-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.css']
})
export class JobsListComponent implements OnInit {
  private readonly candidatureService = inject(CandidatureService);

  protected readonly candidatures = signal<CandidatureResponseDTO[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly filterStatus = signal<string>('all');
  
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly pageSize = 10;

  protected readonly filteredJobs = computed(() => {
    let filtered = this.candidatures();
    
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(candidature => 
        candidature.companyName.toLowerCase().includes(query) ||
        candidature.jobTitle.toLowerCase().includes(query)
      );
    }

    if (this.filterStatus() !== 'all') {
      filtered = filtered.filter(candidature => 
        candidature.status === this.filterStatus()
      );
    }

    return filtered;
  });

  ngOnInit(): void {
    this.loadCandidatures();
  }

  loadCandidatures(): void {
    this.isLoading.set(true);
    this.candidatureService.getAllCandidatures(
      this.currentPage(),
      this.pageSize
    ).subscribe({
      next: (page) => {
        this.candidatures.set(page.content);
        this.totalPages.set(page.totalPages);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading candidatures:', error);
        this.isLoading.set(false);
      }
    });
  }

  getStatusLabel(status: CandidatureStatus): string {
    const labels: Record<CandidatureStatus, string> = {
      [CandidatureStatus.PENDING]: 'En attente',
      [CandidatureStatus.REVIEWING]: 'En cours d\'examen',
      [CandidatureStatus.SHORTLISTED]: 'Présélectionné',
      [CandidatureStatus.INTERVIEW_SCHEDULED]: 'Entretien planifié',
      [CandidatureStatus.REJECTED]: 'Refusée',
      [CandidatureStatus.ACCEPTED]: 'Acceptée',
      [CandidatureStatus.WITHDRAWN]: 'Retirée'
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: CandidatureStatus): string {
    const classes: Record<CandidatureStatus, string> = {
      [CandidatureStatus.PENDING]: 'badge-info',
      [CandidatureStatus.REVIEWING]: 'badge-info',
      [CandidatureStatus.SHORTLISTED]: 'badge-warning',
      [CandidatureStatus.INTERVIEW_SCHEDULED]: 'badge-warning',
      [CandidatureStatus.REJECTED]: 'badge-error',
      [CandidatureStatus.ACCEPTED]: 'badge-success',
      [CandidatureStatus.WITHDRAWN]: 'badge-error'
    };
    return classes[status] || 'badge-info';
  }

  formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateStr));
  }

  withdrawCandidature(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir retirer cette candidature ?')) {
      this.candidatureService.withdrawCandidature(id).subscribe({
        next: () => {
          this.loadCandidatures();
        },
        error: (error) => {
          console.error('Error withdrawing candidature:', error);
          alert('Impossible de retirer cette candidature. Elle a peut-être déjà été traitée.');
        }
      });
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadCandidatures();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadCandidatures();
    }
  }
}
