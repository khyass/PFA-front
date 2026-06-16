import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobOfferService } from '../../core/services/job-offer.service';
import { AiService } from '../../core/services/ai.service';
import { JobOfferResponseDTO, JobOfferStatus } from '../../core/models/job-offer.models';
import { JobSuggestionDTO } from '../../core/models/ai.models';

@Component({
  selector: 'app-job-search',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="header">
        <h1>Offres d'emploi</h1>
        <p>Découvrez les opportunités qui correspondent à votre profil</p>
      </div>

      <!-- AI Suggestions -->
      <div class="suggestions-section" *ngIf="suggestions().length > 0">
        <h2>🤖 Recommandations AI pour vous</h2>
        <div class="suggestions-grid">
          <div *ngFor="let suggestion of suggestions()" class="suggestion-card" [routerLink]="['/job-details', suggestion.jobOfferId]">
            <div class="match-score">{{ suggestion.matchScore }}%</div>
            <h3>{{ suggestion.jobTitle }}</h3>
            <p class="company">{{ suggestion.companyName }}</p>
            <p class="location">📍 {{ suggestion.location }}</p>
            <p class="match-reason">{{ suggestion.matchReason }}</p>
            <div class="skills-matched" *ngIf="suggestion.skillsMatched.length > 0">
              <span *ngFor="let skill of suggestion.skillsMatched" class="skill-badge">{{ skill }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- All Jobs -->
      <div class="jobs-section">
        <div class="search-bar">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Rechercher par titre, entreprise..." 
            [value]="searchQuery()"
            (input)="searchQuery.set($any($event.target).value); loadJobs()" 
          />
        </div>

        <div class="results-info" *ngIf="!isLoading()">
          <span>{{ jobs().length }} offre(s) trouvée(s)</span>
        </div>

        <div class="loading" *ngIf="isLoading()">
          <div class="spinner"></div>
          <p>Chargement des offres...</p>
        </div>
        
        <div class="jobs-grid" *ngIf="!isLoading()">
          <div *ngFor="let job of jobs()" class="job-card" [routerLink]="['/job-details', job.id]">
            <div class="card-header">
              <div class="company-avatar">{{ job.companyName.charAt(0) }}</div>
              <div class="card-header-info">
                <h3 class="job-title">{{ job.title }}</h3>
                <p class="company-name">{{ job.companyName }}</p>
              </div>
            </div>
            <p class="job-notes" *ngIf="job.notes">{{ job.notes }}</p>
            <div class="card-footer">
              <span class="status-badge" [class.open]="job.status === 'OPEN'" [class.closed]="job.status === 'CLOSED'" [class.draft]="job.status === 'DRAFT'">{{ job.status }}</span>
              <span class="published-date" *ngIf="job.publishedDate">{{ $any(job.publishedDate) | date:'mediumDate' }}</span>
            </div>
          </div>
        </div>

        <div class="no-results" *ngIf="!isLoading() && jobs().length === 0">
          <p>Aucune offre trouvée.</p>
        </div>

        <div class="pagination" *ngIf="totalPages() > 1">
          <button (click)="previousPage()" [disabled]="currentPage() === 0">Précédent</button>
          <span>Page {{ currentPage() + 1 }} / {{ totalPages() }}</span>
          <button (click)="nextPage()" [disabled]="currentPage() === totalPages() - 1">Suivant</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .header { margin-bottom: 2rem; }
    .header h1 { font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0; }
    .header p { color: #64748b; margin: 0; }

    .suggestions-section { margin-bottom: 3rem; }
    .suggestions-section h2 { font-size: 1.25rem; margin-bottom: 1rem; }
    .suggestions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .suggestion-card { 
      border: 1px solid #e2e8f0; 
      border-radius: 12px; 
      padding: 1.5rem; 
      cursor: pointer; 
      transition: transform 0.2s, box-shadow 0.2s;
      background: white;
    }
    .suggestion-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .match-score { 
      display: inline-block; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 0.25rem 0.75rem; 
      border-radius: 20px; 
      font-weight: bold; 
      margin-bottom: 1rem;
    }
    .company { color: #64748b; font-weight: 500; }
    .location { color: #94a3b8; font-size: 0.9rem; }
    .match-reason { color: #475569; font-size: 0.9rem; margin: 0.5rem 0; }
    .skill-badge { 
      display: inline-block; 
      background: #f1f5f9; 
      padding: 0.25rem 0.75rem; 
      border-radius: 12px; 
      font-size: 0.8rem; 
      margin-right: 0.5rem; 
      margin-bottom: 0.5rem;
      color: #334155;
    }

    /* Search bar */
    .search-bar {
      position: relative;
      margin-bottom: 2rem;
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-bar input { 
      width: 100%;
      padding: 0.875rem 1rem 0.875rem 3rem;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      font-size: 1rem;
      background: white;
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .search-bar input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
    }

    .results-info {
      margin-bottom: 1.5rem;
      color: #64748b;
      font-size: 0.9rem;
    }

    /* Loading */
    .loading { 
      text-align: center; 
      padding: 3rem;
      color: #64748b;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Job cards */
    .jobs-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
      gap: 1.25rem; 
    }
    .job-card { 
      border: 1px solid #e2e8f0; 
      border-radius: 12px; 
      padding: 1.25rem; 
      cursor: pointer; 
      transition: transform 0.2s, box-shadow 0.2s;
      background: white;
      display: flex;
      flex-direction: column;
    }
    .job-card:hover { 
      transform: translateY(-3px); 
      box-shadow: 0 8px 24px rgba(0,0,0,0.08); 
      border-color: #cbd5e1;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      margin-bottom: 0.75rem;
    }
    .company-avatar {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      flex-shrink: 0;
      text-transform: uppercase;
    }
    .card-header-info { overflow: hidden; }
    .job-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .company-name {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0.15rem 0 0 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .job-notes {
      font-size: 0.85rem;
      color: #475569;
      margin: 0 0 0.75rem 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.5;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }
    .status-badge {
      display: inline-block;
      padding: 0.2rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background-color: #f1f5f9;
      color: #64748b;
    }
    .status-badge.open { background-color: #dcfce7; color: #16a34a; }
    .status-badge.closed { background-color: #fee2e2; color: #dc2626; }
    .status-badge.draft { background-color: #e0e7ff; color: #4f46e5; }

    .published-date {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .no-results {
      text-align: center;
      padding: 3rem;
      color: #64748b;
    }

    /* Pagination */
    .pagination { 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      gap: 1rem; 
      margin-top: 2.5rem; 
    }
    .pagination button { 
      padding: 0.5rem 1.25rem; 
      border: 1px solid #e2e8f0; 
      border-radius: 8px; 
      cursor: pointer; 
      background: white;
      font-weight: 500;
      color: #334155;
      transition: background 0.2s;
    }
    .pagination button:hover:not(:disabled) { background: #f8fafc; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination span { color: #64748b; font-size: 0.9rem; }
  `]
})
export class JobSearchComponent implements OnInit {
  private readonly jobOfferService = inject(JobOfferService);
  private readonly aiService = inject(AiService);

  suggestions = signal<JobSuggestionDTO[]>([]);
  jobs = signal<JobOfferResponseDTO[]>([]);
  isLoading = signal(false);
  searchQuery = signal('');
  
  currentPage = signal(0);
  totalPages = signal(0);
  pageSize = 12;

  ngOnInit(): void {
    this.loadSuggestions();
    this.loadJobs();
  }

  loadSuggestions(): void {
    this.aiService.getSuggestions().subscribe({
      next: (response) => {
        if (!response.computing) {
          this.suggestions.set(response.suggestions);
        }
      },
      error: (error) => console.error('Error loading suggestions:', error)
    });
  }

  loadJobs(): void {
    this.isLoading.set(true);
    this.jobOfferService.getAllJobOffers(
      this.currentPage(),
      this.pageSize,
      JobOfferStatus.OPEN,
      this.searchQuery()
    ).subscribe({
      next: (page) => {
        this.jobs.set(page.content);
        this.totalPages.set(page.totalPages);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.isLoading.set(false);
      }
    });
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadJobs();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadJobs();
    }
  }
}
