import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AiService } from '../../core/services/ai.service';
import { InterviewPrepResponse, QuestionAnswer } from '../../core/models/ai.models';

@Component({
  selector: 'app-interview-prep',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="prep-container">
      <a routerLink="/job-search" class="back-link">← Retour aux offres</a>

      <div class="page-header">
        <h1 class="page-title">🎯 Préparation Entretien</h1>
        <p class="page-subtitle" *ngIf="prepData()">
          {{ prepData()!.jobTitle }} chez {{ prepData()!.companyName }}
        </p>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading()">
        <div class="loading-spinner-large"></div>
        <p>L'IA génère vos questions d'entretien personnalisées...</p>
        <p class="loading-hint">Cela peut prendre quelques secondes</p>
      </div>

      <!-- Error State -->
      <div class="error-banner" *ngIf="errorMessage()">
        <p>{{ errorMessage() }}</p>
        <button class="btn-retry" (click)="loadPrep(true)">Réessayer</button>
      </div>

      <!-- Results -->
      <div class="results" *ngIf="prepData() && !isLoading()">
        <!-- Regenerate button -->
        <div class="regenerate-row">
          <button class="btn-regenerate" (click)="loadPrep(true)" [disabled]="isLoading()">
            🔄 Régénérer les questions
          </button>
        </div>

        <!-- Technical Questions -->
        <div class="section">
          <h2 class="section-title">💻 Questions techniques ({{ prepData()!.technicalQuestions.length }})</h2>
          <div class="accordion" *ngFor="let qa of prepData()!.technicalQuestions; let i = index">
            <button class="accordion-header" (click)="toggleQuestion('tech', i)">
              <span class="question-number">{{ i + 1 }}</span>
              <span class="question-text">{{ qa.question }}</span>
              <span class="accordion-icon" [class.open]="isOpen('tech', i)">▼</span>
            </button>
            <div class="accordion-body" *ngIf="isOpen('tech', i)">
              <p class="answer-label">Points clés à aborder :</p>
              <p class="answer-outline">{{ qa.answerOutline }}</p>
            </div>
          </div>
        </div>

        <!-- Behavioral Questions -->
        <div class="section">
          <h2 class="section-title">🤝 Questions comportementales ({{ prepData()!.behavioralQuestions.length }})</h2>
          <div class="accordion" *ngFor="let qa of prepData()!.behavioralQuestions; let i = index">
            <button class="accordion-header" (click)="toggleQuestion('behav', i)">
              <span class="question-number">{{ i + 1 }}</span>
              <span class="question-text">{{ qa.question }}</span>
              <span class="accordion-icon" [class.open]="isOpen('behav', i)">▼</span>
            </button>
            <div class="accordion-body" *ngIf="isOpen('behav', i)">
              <p class="answer-label">Points clés à aborder :</p>
              <p class="answer-outline">{{ qa.answerOutline }}</p>
            </div>
          </div>
        </div>

        <!-- Disclaimer -->
        <div class="disclaimer">
          ⚠️ Suggestions générées par IA — utilisez-les comme guide, pas comme un script d'entretien garanti.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .prep-container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    
    .back-link { color: #667eea; text-decoration: none; display: inline-block; margin-bottom: 1.5rem; }
    .back-link:hover { text-decoration: underline; }
    
    .page-header { margin-bottom: 2rem; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0; }
    .page-subtitle { color: #64748b; margin-top: 0.5rem; font-size: 1.1rem; }

    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #64748b;
    }
    .loading-spinner-large {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-hint { font-size: 0.85rem; color: #94a3b8; margin-top: 0.5rem; }

    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .btn-retry {
      margin-top: 0.75rem;
      padding: 0.5rem 1.25rem;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .regenerate-row { display: flex; justify-content: flex-end; margin-bottom: 1.5rem; }
    .btn-regenerate {
      padding: 0.625rem 1.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      font-weight: 500;
      color: #334155;
      transition: background 0.2s;
    }
    .btn-regenerate:hover:not(:disabled) { background: #f8fafc; }
    .btn-regenerate:disabled { opacity: 0.6; cursor: not-allowed; }

    .section { margin-bottom: 2rem; }
    .section-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #f1f5f9;
    }

    .accordion {
      margin-bottom: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .accordion-header {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: white;
      border: none;
      cursor: pointer;
      text-align: left;
      font-size: 0.95rem;
      transition: background 0.2s;
    }
    .accordion-header:hover { background: #f8fafc; }

    .question-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      font-size: 0.8rem;
      font-weight: 600;
      flex-shrink: 0;
    }
    .question-text { flex: 1; font-weight: 500; color: #1e293b; }
    .accordion-icon {
      color: #94a3b8;
      font-size: 0.75rem;
      transition: transform 0.2s;
    }
    .accordion-icon.open { transform: rotate(180deg); }

    .accordion-body {
      padding: 0 1.25rem 1.25rem 3.75rem;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
    }

    .answer-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 1rem 0 0.5rem 0;
    }
    .answer-outline {
      color: #334155;
      line-height: 1.6;
      font-size: 0.9rem;
      margin: 0;
    }

    .disclaimer {
      margin-top: 2rem;
      padding: 1rem;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      color: #92400e;
      font-size: 0.85rem;
      text-align: center;
    }

    @media (max-width: 640px) {
      .prep-container { padding: 1rem; }
      .accordion-body { padding-left: 1.25rem; }
    }
  `]
})
export class InterviewPrepComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly aiService = inject(AiService);

  protected readonly prepData = signal<InterviewPrepResponse | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  private readonly openQuestions = signal<Set<string>>(new Set());
  private offerId = '';

  ngOnInit(): void {
    this.offerId = this.route.snapshot.paramMap.get('offerId') || '';
    if (this.offerId) {
      this.loadPrep(false);
    }
  }

  loadPrep(forceRefresh: boolean): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.aiService.generateInterviewPrep(this.offerId, forceRefresh).subscribe({
      next: (data) => {
        this.prepData.set(data);
        this.isLoading.set(false);
        this.openQuestions.set(new Set());
      },
      error: (error) => {
        console.error('Error loading interview prep:', error);
        this.isLoading.set(false);
        if (error.status === 503 || error.status === 502) {
          this.errorMessage.set('Le service IA est temporairement indisponible. Veuillez réessayer.');
        } else {
          this.errorMessage.set('Impossible de générer les questions. Veuillez réessayer.');
        }
      }
    });
  }

  toggleQuestion(type: string, index: number): void {
    const key = `${type}-${index}`;
    this.openQuestions.update(set => {
      const newSet = new Set(set);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  isOpen(type: string, index: number): boolean {
    return this.openQuestions().has(`${type}-${index}`);
  }
}
