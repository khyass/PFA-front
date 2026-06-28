import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiService } from '../../core/services/ai.service';
import { OfferSuggestionResponse } from '../../core/models/ai.models';

@Component({
  selector: 'app-ai-suggestions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="suggestions-container">
      <div class="page-header">
        <h1 class="page-title">🤖 Suggestions IA</h1>
        <p class="page-subtitle">Entrez vos compétences pour recevoir des suggestions d'offres personnalisées</p>
      </div>

      <!-- Keyword Input Section -->
      <div class="keywords-section">
        <div class="chips-container">
          <div class="chip" *ngFor="let keyword of keywords(); let i = index">
            <span>{{ keyword }}</span>
            <button class="chip-remove" (click)="removeKeyword(i)" aria-label="Supprimer">×</button>
          </div>
          <input
            type="text"
            class="chip-input"
            placeholder="Tapez une compétence et appuyez Entrée..."
            [value]="currentInput()"
            (input)="currentInput.set($any($event.target).value)"
            (keydown.enter)="addKeyword($event)"
          />
          <button class="btn-add-chip" (click)="addCurrentKeyword()" [disabled]="!currentInput().trim()">+</button>
        </div>

        <div class="actions-row">
          <span class="keyword-count">{{ keywords().length }} compétence(s)</span>
          <button
            class="btn-suggest"
            (click)="suggestOffers()"
            [disabled]="(keywords().length === 0 && !currentInput().trim()) || isLoading()"
          >
            <span *ngIf="!isLoading()">✨ Suggérer des offres</span>
            <span *ngIf="isLoading()" class="loading-text">
              <span class="spinner"></span> Analyse en cours...
            </span>
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div class="error-banner" *ngIf="errorMessage()">
        <p>{{ errorMessage() }}</p>
      </div>

      <!-- Results Section -->
      <div class="results-section" *ngIf="suggestions().length > 0">
        <h2 class="results-title">Offres compatibles ({{ suggestions().length }})</h2>
        
        <div class="suggestion-card" *ngFor="let suggestion of suggestions()">
          <div class="suggestion-header">
            <div class="suggestion-info">
              <h3 class="suggestion-title">{{ suggestion.offerTitle }}</h3>
              <p class="suggestion-company">{{ suggestion.companyName }}</p>
            </div>
            <div class="score-badge" [ngClass]="getScoreClass(suggestion.score)">
              {{ suggestion.score }}%
            </div>
          </div>
          
          <div class="score-bar-container">
            <div class="score-bar" [style.width.%]="suggestion.score" [ngClass]="getScoreClass(suggestion.score)"></div>
          </div>
          
          <p class="suggestion-justification">{{ suggestion.justification }}</p>
          
          <div class="suggestion-actions">
            <a [routerLink]="['/job-details', suggestion.offerId]" class="btn-view">Voir l'offre →</a>
          </div>
        </div>
      </div>

      <!-- Empty Result State -->
      <div class="empty-state" *ngIf="hasSearched() && suggestions().length === 0 && !isLoading() && !errorMessage()">
        <p>Aucune offre correspondante trouvée. Essayez avec d'autres compétences.</p>
      </div>
    </div>
  `,
  styles: [`
    .suggestions-container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    
    .page-header { margin-bottom: 2rem; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0; }
    .page-subtitle { color: #64748b; margin-top: 0.5rem; }

    .keywords-section {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      min-height: 44px;
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.35rem 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .chip-remove {
      background: none;
      border: none;
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      font-size: 1.1rem;
      line-height: 1;
      padding: 0 0.2rem;
    }
    .chip-remove:hover { color: white; }

    .chip-input {
      flex: 1;
      min-width: 200px;
      border: none;
      outline: none;
      padding: 0.5rem;
      font-size: 0.95rem;
      background: transparent;
    }

    .btn-add-chip {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid #667eea;
      background: white;
      color: #667eea;
      font-size: 1.2rem;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    .btn-add-chip:hover:not(:disabled) { background: #667eea; color: white; }
    .btn-add-chip:disabled { opacity: 0.3; cursor: not-allowed; }

    .actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
    }

    .keyword-count { color: #64748b; font-size: 0.875rem; }

    .btn-suggest {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-suggest:hover:not(:disabled) { opacity: 0.9; }
    .btn-suggest:disabled { opacity: 0.6; cursor: not-allowed; }

    .loading-text { display: inline-flex; align-items: center; gap: 0.5rem; }
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .results-section { margin-top: 1rem; }
    .results-title { font-size: 1.25rem; font-weight: 600; color: #1e293b; margin-bottom: 1rem; }

    .suggestion-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: box-shadow 0.2s;
    }
    .suggestion-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

    .suggestion-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .suggestion-info { flex: 1; }
    .suggestion-title { font-size: 1.1rem; font-weight: 600; color: #1e293b; margin: 0; }
    .suggestion-company { color: #64748b; font-size: 0.9rem; margin: 0.25rem 0 0 0; }

    .score-badge {
      font-size: 1.1rem;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      min-width: 50px;
      text-align: center;
    }
    .score-badge.score-high { background: #dcfce7; color: #16a34a; }
    .score-badge.score-medium { background: #fef9c3; color: #ca8a04; }
    .score-badge.score-low { background: #fee2e2; color: #dc2626; }

    .score-bar-container {
      height: 6px;
      background: #f1f5f9;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }
    .score-bar {
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s ease;
    }
    .score-bar.score-high { background: #16a34a; }
    .score-bar.score-medium { background: #ca8a04; }
    .score-bar.score-low { background: #dc2626; }

    .suggestion-justification {
      color: #475569;
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0 0 0.75rem 0;
    }

    .suggestion-actions { display: flex; justify-content: flex-end; }
    .btn-view {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .btn-view:hover { text-decoration: underline; }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #64748b;
    }

    @media (max-width: 640px) {
      .suggestions-container { padding: 1rem; }
      .actions-row { flex-direction: column; gap: 0.75rem; align-items: stretch; }
      .btn-suggest { width: 100%; }
    }
  `]
})
export class AiSuggestionsComponent {
  private readonly aiService = inject(AiService);

  protected readonly keywords = signal<string[]>([]);
  protected readonly currentInput = signal('');
  protected readonly suggestions = signal<OfferSuggestionResponse[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly hasSearched = signal(false);

  addKeyword(event: Event): void {
    event.preventDefault();
    this.addCurrentKeyword();
  }

  addCurrentKeyword(): void {
    const value = this.currentInput().trim();
    if (value && !this.keywords().includes(value)) {
      this.keywords.update(kws => [...kws, value]);
    }
    this.currentInput.set('');
  }

  removeKeyword(index: number): void {
    this.keywords.update(kws => kws.filter((_, i) => i !== index));
  }

  suggestOffers(): void {
    // Auto-add any text still in the input
    if (this.currentInput().trim()) {
      this.addCurrentKeyword();
    }
    if (this.keywords().length === 0) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.hasSearched.set(true);

    this.aiService.suggestOffers(this.keywords()).subscribe({
      next: (results) => {
        this.suggestions.set(results);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error getting suggestions:', error);
        this.isLoading.set(false);
        if (error.status === 503 || error.status === 502) {
          this.errorMessage.set('Le service de suggestions IA est temporairement indisponible. Veuillez réessayer.');
        } else {
          this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
        }
      }
    });
  }

  getScoreClass(score: number): string {
    if (score >= 75) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  }
}
