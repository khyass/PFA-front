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
        <div class="section-header">
          <h2>Toutes les offres</h2>
          <div class="filters">
            <input 
              type="text" 
              placeholder="Rechercher..." 
              [value]="searchQuery()"
              (input)="searchQuery.set($any($event.target).value); loadJobs()" 
            />
          </div>
        </div>

        <div class="loading" *ngIf="isLoading()">Chargement...</div>
        
        <div class="jobs-grid" *ngIf="!isLoading()">
          <div *ngFor="let job of jobs()" class="job-card" [routerLink]="['/job-details', job.id]">
            <h3>{{ job.title }}</h3>
            <p class="company">{{ job.companyName }}</p>
            <p class="location">📍 {{ job.location }}</p>
            <p class="contract-type">{{ job.contractType }}</p>
            <div class="skills">
              <span *ngFor="let skill of job.requiredSkills.slice(0, 3)" class="skill-badge">{{ skill }}</span>
            </div>
            <p class="published-date">Publié le {{ job.publishedDate | date:'short' }}</p>
          </div>
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
    .container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .header { margin-bottom: 2rem; }
    .suggestions-section { margin-bottom: 3rem; }
    .suggestions-grid, .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .suggestion-card, .job-card { 
      border: 1px solid #e0e0e0; 
      border-radius: 8px; 
      padding: 1.5rem; 
      cursor: pointer; 
      transition: transform 0.2s, box-shadow 0.2s;
      background: white;
    }
    .suggestion-card:hover, .job-card:hover { transform: translateY(-4px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .match-score { 
      display: inline-block; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 0.25rem 0.75rem; 
      border-radius: 20px; 
      font-weight: bold; 
      margin-bottom: 1rem;
    }
    .company { color: #666; font-weight: 500; }
    .location { color: #888; font-size: 0.9rem; }
    .match-reason { color: #555; font-size: 0.9rem; margin: 0.5rem 0; }
    .skill-badge { 
      display: inline-block; 
      background: #f0f0f0; 
      padding: 0.25rem 0.75rem; 
      border-radius: 12px; 
      font-size: 0.85rem; 
      margin-right: 0.5rem; 
      margin-bottom: 0.5rem;
    }
    .filters { display: flex; gap: 1rem; }
    .filters input { 
      padding: 0.5rem 1rem; 
      border: 1px solid #ddd; 
      border-radius: 4px; 
      flex: 1;
    }
    .loading { text-align: center; padding: 2rem; }
    .pagination { 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      gap: 1rem; 
      margin-top: 2rem; 
    }
    .pagination button { 
      padding: 0.5rem 1rem; 
      border: 1px solid #ddd; 
      border-radius: 4px; 
      cursor: pointer; 
      background: white;
    }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
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
      JobOfferStatus.PUBLISHED,
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
