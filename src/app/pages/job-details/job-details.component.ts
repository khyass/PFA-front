import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobOfferService } from '../../core/services/job-offer.service';
import { CandidatureService } from '../../core/services/candidature.service';
import { AiService } from '../../core/services/ai.service';
import { AuthService } from '../../core/services/auth.service';
import { JobOfferResponseDTO, JobOfferStatus } from '../../core/models/job-offer.models';
import { JobMatchResponseDTO } from '../../core/models/ai.models';
import { CandidatureRequestDTO } from '../../core/models/candidature.models';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container" *ngIf="job()">
      <div class="back-button" (click)="goBack()">← Retour</div>
      
      <!-- ENTERPRISE: Editable Form -->
      <div *ngIf="isEnterprise()">
        <div class="section-card">
          <h2 class="section-title">Modifier l'offre</h2>

          <div class="form-group">
            <label for="editTitle">Titre du poste *</label>
            <input
              type="text"
              id="editTitle"
              [(ngModel)]="editTitle"
              name="editTitle"
              class="form-input"
              placeholder="Titre du poste"
            />
          </div>

          <div class="form-group">
            <label for="editCompany">Entreprise</label>
            <input
              type="text"
              id="editCompany"
              [value]="job()!.companyName"
              class="form-input"
              readonly
            />
          </div>

          <div class="form-group">
            <label for="editStatus">Statut</label>
            <select
              id="editStatus"
              [(ngModel)]="editStatus"
              name="editStatus"
              class="form-select"
            >
              <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="editNotes">Notes</label>
            <textarea
              id="editNotes"
              [(ngModel)]="editNotes"
              name="editNotes"
              rows="4"
              class="form-input"
              placeholder="Ajoutez des notes..."
            ></textarea>
          </div>

          <div class="error-message" *ngIf="errorMessage()">{{ errorMessage() }}</div>
          <div class="success-message" *ngIf="successMessage()">{{ successMessage() }}</div>

          <div class="form-actions">
            <button class="btn-save" (click)="updateJobOffer()" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
        </div>

        <!-- Candidatures list for Enterprise -->
        <div class="section-card" *ngIf="job()!.candidatureCount">
          <h2 class="section-title">Candidatures reçues ({{ job()!.candidatureCount }})</h2>
          <button class="btn-outline" (click)="loadCandidatures()">
            Charger les candidatures
          </button>
        </div>
      </div>

      <!-- CANDIDATE: Read-only view -->
      <div *ngIf="isCandidate()">
        <div class="job-header">
          <h1>{{ job()!.title }}</h1>
          <h2>{{ job()!.companyName }}</h2>
          <div class="meta-info">
            <span class="status-badge">{{ job()!.status }}</span>
          </div>
        </div>

        <!-- AI Match Score -->
        <div class="match-section" *ngIf="match()">
          <h3>🤖 Votre correspondance AI</h3>
          <div class="match-score-large">{{ match()!.matchScore }}%</div>
          <p class="match-feedback">{{ match()!.overallFeedback }}</p>
          
          <div class="skills-section">
            <div class="skills-matched" *ngIf="match()!.skillsMatched.length > 0">
              <h4>✅ Compétences correspondantes</h4>
              <div class="skills-list">
                <span *ngFor="let skill of match()!.skillsMatched" class="skill-badge success">{{ skill }}</span>
              </div>
            </div>
            
            <div class="skills-gap" *ngIf="match()!.skillsGap.length > 0">
              <h4>📚 Compétences à développer</h4>
              <div class="skills-list">
                <span *ngFor="let skill of match()!.skillsGap" class="skill-badge warning">{{ skill }}</span>
              </div>
            </div>
          </div>

          <div class="interview-prep" *ngIf="match()!.interviewQuestions.length > 0">
            <h4>💡 Questions d'entretien potentielles</h4>
            <ul>
              <li *ngFor="let question of match()!.interviewQuestions">{{ question }}</li>
            </ul>
          </div>
        </div>

        <!-- AI Interview Chatbot Button -->
        <div class="section-card interview-prep-section">
          <div class="chatbot-promo">
            <div class="chatbot-icon">🎯</div>
            <div class="chatbot-text">
              <h3>Préparer votre entretien avec l'IA</h3>
              <p>Discutez en temps réel avec votre coach IA : questions techniques, comportementales, feedback sur vos réponses.</p>
            </div>
          </div>
          <a [routerLink]="['/interview-prep', job()!.id]" class="btn-chatbot">
            💬 Lancer le Coach Entretien IA
          </a>
        </div>

        <!-- Notes -->
        <div class="section-card" *ngIf="job()!.notes">
          <h3>Notes</h3>
          <p>{{ job()!.notes }}</p>
        </div>

        <!-- Application Form (CANDIDATE only) -->
        <div class="section-card">
          <h3>Postuler à cette offre</h3>
          <form (ngSubmit)="submitApplication()">
            <div class="form-group">
              <label for="coverLetter">Lettre de motivation *</label>
              <div class="ai-generate-row">
                <select [(ngModel)]="coverLetterTone" name="coverLetterTone" class="tone-select">
                  <option value="formal">Formel</option>
                  <option value="enthusiastic">Enthousiaste</option>
                  <option value="casual">Décontracté</option>
                </select>
                <button type="button" class="btn-ai-generate" (click)="generateCoverLetter()" [disabled]="isGeneratingCoverLetter()">
                  <span *ngIf="!isGeneratingCoverLetter()">✨ Générer avec IA</span>
                  <span *ngIf="isGeneratingCoverLetter()" class="ai-loading">
                    <span class="ai-spinner"></span> Génération en cours...
                  </span>
                </button>
              </div>
              <div class="ai-loader-overlay" *ngIf="isGeneratingCoverLetter()">
                <div class="ai-loader-content">
                  <div class="ai-spinner-large"></div>
                  <p>L'IA rédige votre lettre de motivation...</p>
                </div>
              </div>
              <textarea 
                id="coverLetter" 
                rows="8" 
                [(ngModel)]="coverLetter" 
                name="coverLetter"
                class="form-input"
                placeholder="Expliquez pourquoi vous êtes le candidat idéal pour ce poste..."
                required
              ></textarea>
              <div class="ai-error" *ngIf="coverLetterError()">{{ coverLetterError() }}</div>
            </div>
            
            <div class="form-group">
              <label for="resumeUrl">Lien vers votre CV (optionnel)</label>
              <input 
                type="url" 
                id="resumeUrl" 
                [(ngModel)]="resumeUrl" 
                name="resumeUrl"
                class="form-input"
                placeholder="https://mon-cv.pdf"
              />
            </div>

            <div class="error-message" *ngIf="errorMessage()">{{ errorMessage() }}</div>
            <div class="success-message" *ngIf="successMessage()">{{ successMessage() }}</div>

            <button type="submit" class="btn-save" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Envoi en cours...' : 'Envoyer ma candidature' }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <div class="loading" *ngIf="!job()">Chargement...</div>
  `,
  styles: [`
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .back-button { cursor: pointer; color: #667eea; margin-bottom: 1.5rem; display: inline-block; }
    .back-button:hover { text-decoration: underline; }
    
    .job-header { margin-bottom: 2rem; }
    .job-header h1 { margin-bottom: 0.5rem; }
    .job-header h2 { color: #666; font-weight: 500; }
    .meta-info { display: flex; gap: 1rem; margin-top: 1rem; color: #888; }
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      background-color: #dbeafe;
      color: #1d4ed8;
    }
    
    .section-card {
      margin-bottom: 2rem;
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 1.5rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .match-section { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 2rem; 
      border-radius: 12px; 
      margin-bottom: 2rem; 
    }
    .match-score-large { font-size: 4rem; font-weight: bold; text-align: center; margin: 1rem 0; }
    .match-feedback { text-align: center; font-size: 1.1rem; opacity: 0.9; }
    .skills-section { margin-top: 1.5rem; }
    .skills-matched, .skills-gap { margin-bottom: 1rem; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .skill-badge { padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.9rem; background: rgba(255,255,255,0.2); }
    .skill-badge.success { background: rgba(76, 175, 80, 0.3); }
    .skill-badge.warning { background: rgba(255, 152, 0, 0.3); }
    .interview-prep { margin-top: 1.5rem; }
    .interview-prep ul { margin-top: 0.5rem; padding-left: 1.5rem; }
    .interview-prep li { margin-bottom: 0.5rem; }
    
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #334155; }
    .form-input, .form-select { 
      width: 100%; 
      padding: 0.75rem; 
      border: 1px solid #e2e8f0; 
      border-radius: 8px; 
      font-family: inherit;
      font-size: 0.95rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .form-input:focus, .form-select:focus { outline: none; border-color: #667eea; }
    .form-input[readonly] { background-color: #f8fafc; color: #64748b; }
    
    .form-actions { display: flex; justify-content: flex-end; margin-top: 1.5rem; }
    .btn-save { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 0.75rem 2rem; 
      border: none; 
      border-radius: 8px; 
      font-size: 1rem; 
      font-weight: 600; 
      cursor: pointer; 
      width: 100%;
    }
    .btn-save:hover { opacity: 0.9; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-outline {
      padding: 0.625rem 1.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      font-weight: 500;
      color: #334155;
    }
    .btn-outline:hover { background: #f8fafc; }
    
    .error-message { color: #dc2626; margin-bottom: 1rem; padding: 0.75rem; background: #fef2f2; border-radius: 8px; }
    .success-message { color: #16a34a; margin-bottom: 1rem; padding: 0.75rem; background: #f0fdf4; border-radius: 8px; }
    .loading { text-align: center; padding: 4rem; }

    .interview-prep-section { margin-bottom: 2rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .chatbot-promo {
      display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem;
    }
    .chatbot-icon { font-size: 2rem; flex-shrink: 0; }
    .chatbot-text h3 { margin: 0 0 0.4rem 0; font-size: 1.1rem; color: #1e293b; }
    .chatbot-text p { margin: 0; color: #64748b; font-size: 0.9rem; line-height: 1.5; }
    .btn-chatbot {
      display: block;
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      transition: opacity 0.2s, transform 0.15s;
      box-sizing: border-box;
    }
    .btn-chatbot:hover { opacity: 0.92; transform: translateY(-1px); }

    .ai-generate-row {
      display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;
    }
    .tone-select {
      padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.85rem; background: white; color: #334155;
    }
    .btn-ai-generate {
      padding: 0.5rem 1rem; border: none; border-radius: 8px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer;
      white-space: nowrap;
    }
    .btn-ai-generate:hover { opacity: 0.9; }
    .btn-ai-generate:disabled { opacity: 0.6; cursor: not-allowed; }
    .ai-loading { display: inline-flex; align-items: center; gap: 0.4rem; }
    .ai-spinner {
      display: inline-block; width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.4); border-top-color: white;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    .ai-loader-overlay {
      display: flex; align-items: center; justify-content: center;
      padding: 1.5rem; margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 8px; border: 1px solid #f59e0b;
    }
    .ai-loader-content { display: flex; align-items: center; gap: 0.75rem; color: #92400e; font-weight: 500; }
    .ai-spinner-large {
      width: 24px; height: 24px;
      border: 3px solid #fcd34d; border-top-color: #d97706;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    .ai-error { color: #dc2626; font-size: 0.85rem; margin-top: 0.25rem; }
  `]
})
export class JobDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobOfferService = inject(JobOfferService);
  private readonly candidatureService = inject(CandidatureService);
  private readonly aiService = inject(AiService);
  private readonly authService = inject(AuthService);

  job = signal<JobOfferResponseDTO | null>(null);
  match = signal<JobMatchResponseDTO | null>(null);
  
  // Candidate fields
  coverLetter = '';
  resumeUrl = '';
  coverLetterTone = 'formal';
  isGeneratingCoverLetter = signal(false);
  coverLetterError = signal('');

  // Enterprise edit fields
  editTitle = '';
  editStatus = '';
  editNotes = '';
  statuses = Object.values(JobOfferStatus);

  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  isEnterprise(): boolean {
    return this.authService.isEnterprise();
  }

  isCandidate(): boolean {
    return this.authService.isCandidate();
  }

  ngOnInit(): void {
    const jobId = this.route.snapshot.paramMap.get('id');
    if (jobId) {
      this.loadJob(jobId);
      if (this.isCandidate()) {
        this.loadMatch(jobId);
      }
    }
  }

  loadJob(id: string): void {
    this.jobOfferService.getJobOfferById(id).subscribe({
      next: (job) => {
        this.job.set(job);
        // Pre-fill edit fields for enterprise
        this.editTitle = job.title;
        this.editStatus = job.status;
        this.editNotes = job.notes || '';
      },
      error: (error) => console.error('Error loading job:', error)
    });
  }

  loadMatch(jobOfferId: string): void {
    this.aiService.getMatch(jobOfferId).subscribe({
      next: (match) => this.match.set(match),
      error: (error) => console.error('Error loading match:', error)
    });
  }

  updateJobOffer(): void {
    if (!this.editTitle.trim()) {
      this.errorMessage.set('Le titre est obligatoire');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const request = {
      title: this.editTitle,
      companyName: this.job()!.companyName,
      status: this.editStatus as JobOfferStatus,
      notes: this.editNotes || undefined
    };

    this.jobOfferService.updateJobOffer(this.job()!.id, request).subscribe({
      next: (updated) => {
        this.job.set(updated);
        this.isSubmitting.set(false);
        this.successMessage.set('Offre mise à jour avec succès!');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        console.error('Error updating job offer:', error);
        this.errorMessage.set('Erreur lors de la mise à jour.');
      }
    });
  }

  loadCandidatures(): void {
    // Navigate or load candidatures for this job
    this.jobOfferService.getCandidaturesForJobOffer(this.job()!.id).subscribe({
      next: (candidatures) => {
        console.log('Candidatures:', candidatures);
      },
      error: (error) => console.error('Error loading candidatures:', error)
    });
  }

  submitApplication(): void {
    if (!this.coverLetter.trim()) {
      this.errorMessage.set('La lettre de motivation est obligatoire');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const request: CandidatureRequestDTO = {
      jobOfferId: this.job()!.id,
      coverLetter: this.coverLetter,
      resumeUrl: this.resumeUrl || undefined
    };

    this.candidatureService.createCandidature(request).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Candidature envoyée avec succès!');
        setTimeout(() => this.router.navigate(['/jobs']), 2000);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        console.error('Error submitting application:', error);
        
        if (error.status === 409) {
          this.errorMessage.set('Vous avez déjà postulé à cette offre');
        } else {
          this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
        }
      }
    });
  }

  goBack(): void {
    if (this.isEnterprise()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/job-search']);
    }
  }

  generateCoverLetter(): void {
    const jobId = this.job()?.id;
    if (!jobId) return;

    this.isGeneratingCoverLetter.set(true);
    this.coverLetterError.set('');

    this.aiService.generateCoverLetter(jobId, undefined, this.coverLetterTone).subscribe({
      next: (response) => {
        this.coverLetter = response.coverLetter;
        this.isGeneratingCoverLetter.set(false);
      },
      error: (error) => {
        console.error('Error generating cover letter:', error);
        this.isGeneratingCoverLetter.set(false);
        this.coverLetterError.set('Impossible de générer la lettre. Veuillez réessayer.');
      }
    });
  }
}
