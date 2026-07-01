import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  private readonly router = inject(Router);

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
        (candidature.companyName || '').toLowerCase().includes(query) ||
        (candidature.jobTitle || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  });

  ngOnInit(): void {
    this.loadCandidatures();
  }

  onFilterChange(status: string): void {
    this.filterStatus.set(status);
    this.currentPage.set(0);
    this.loadCandidatures();
  }

  loadCandidatures(): void {
    this.isLoading.set(true);
    const status = this.filterStatus() !== 'all' ? this.filterStatus() : undefined;
    this.candidatureService.getAllCandidatures(
      this.currentPage(),
      this.pageSize,
      'appliedDate',
      'desc',
      status
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
      [CandidatureStatus.INTERVIEW]: 'Entretien',
      [CandidatureStatus.OFFER]: 'Offre reçue',
      [CandidatureStatus.HIRED]: 'Embauché',
      [CandidatureStatus.ACCEPTED]: 'Acceptée',
      [CandidatureStatus.REJECTED]: 'Refusée'
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: CandidatureStatus): string {
    const classes: Record<CandidatureStatus, string> = {
      [CandidatureStatus.PENDING]: 'badge-info',
      [CandidatureStatus.REVIEWING]: 'badge-warning',
      [CandidatureStatus.INTERVIEW]: 'badge-interview',
      [CandidatureStatus.OFFER]: 'badge-offer',
      [CandidatureStatus.HIRED]: 'badge-success',
      [CandidatureStatus.ACCEPTED]: 'badge-success',
      [CandidatureStatus.REJECTED]: 'badge-error'
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

  editCandidature(candidature: CandidatureResponseDTO): void {
    if (candidature.status !== CandidatureStatus.PENDING) {
      return;
    }
    this.router.navigate(['/edit-candidature', candidature.id]);
  }

  hasAlreadyApplied(jobOfferId: string): boolean {
    return this.candidatures().some(c => c.jobOfferId === jobOfferId);
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
