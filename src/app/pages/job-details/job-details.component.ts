import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobOfferService } from '../../core/services/job-offer.service';
import { CandidatureService } from '../../core/services/candidature.service';
import { AiService } from '../../core/services/ai.service';
import { JobOfferResponseDTO } from '../../core/models/job-offer.models';
import { JobMatchResponseDTO } from '../../core/models/ai.models';
import { CandidatureRequestDTO } from '../../core/models/candidature.models';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container" *ngIf="job()">
      <div class="back-button" (click)="goBack()">← Retour</div>
      
      <div class="job-header">
        <h1>{{ job()!.title }}</h1>
        <h2>{{ job()!.companyName }}</h2>
        <div class="meta-info">
          <span>📍 {{ job()!.location }}</span>
          <span>📄 {{ job()!.contractType }}</span>
          <span>📊 {{ job()!.experienceLevel }}</span>
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

      <!-- Job Description -->
      <div class="job-description">
        <h3>Description du poste</h3>
        <p>{{ job()!.description }}</p>
      </div>

      <!-- Required Skills -->
      <div class="required-skills">
        <h3>Compétences requises</h3>
        <div class="skills-list">
          <span *ngFor="let skill of job()!.requiredSkills" class="skill-badge">{{ skill }}</span>
        </div>
      </div>

      <!-- Salary -->
      <div class="salary-info" *ngIf="job()!.salaryMin || job()!.salaryMax">
        <h3>Rémunération</h3>
        <p>
          <span *ngIf="job()!.salaryMin">{{ job()!.salaryMin }} €</span>
          <span *ngIf="job()!.salaryMin && job()!.salaryMax"> - </span>
          <span *ngIf="job()!.salaryMax">{{ job()!.salaryMax }} €</span>
          par an
        </p>
      </div>

      <!-- Application Form -->
      <div class="application-section">
        <h3>Postuler à cette offre</h3>
        <form (ngSubmit)="submitApplication()">
          <div class="form-group">
            <label for="coverLetter">Lettre de motivation *</label>
            <textarea 
              id="coverLetter" 
              rows="8" 
              [(ngModel)]="coverLetter" 
              name="coverLetter"
              placeholder="Expliquez pourquoi vous êtes le candidat idéal pour ce poste..."
              required
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="resumeUrl">Lien vers votre CV (optionnel)</label>
            <input 
              type="url" 
              id="resumeUrl" 
              [(ngModel)]="resumeUrl" 
              name="resumeUrl"
              placeholder="https://mon-cv.pdf"
            />
          </div>

          <div class="error-message" *ngIf="errorMessage()">{{ errorMessage() }}</div>
          <div class="success-message" *ngIf="successMessage()">{{ successMessage() }}</div>

          <button type="submit" class="submit-btn" [disabled]="isSubmitting()">
            {{ isSubmitting() ? 'Envoi en cours...' : 'Envoyer ma candidature' }}
          </button>
        </form>
      </div>
    </div>

    <div class="loading" *ngIf="!job()">Chargement...</div>
  `,
  styles: [`
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .back-button { cursor: pointer; color: #667eea; margin-bottom: 1rem; }
    .back-button:hover { text-decoration: underline; }
    .job-header { margin-bottom: 2rem; }
    .job-header h1 { margin-bottom: 0.5rem; }
    .job-header h2 { color: #666; font-weight: 500; }
    .meta-info { display: flex; gap: 1rem; margin-top: 1rem; color: #888; }
    
    .match-section { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 2rem; 
      border-radius: 12px; 
      margin-bottom: 2rem; 
    }
    .match-score-large { 
      font-size: 4rem; 
      font-weight: bold; 
      text-align: center; 
      margin: 1rem 0; 
    }
    .match-feedback { text-align: center; font-size: 1.1rem; opacity: 0.9; }
    
    .skills-section { margin-top: 1.5rem; }
    .skills-matched, .skills-gap { margin-bottom: 1rem; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .skill-badge { 
      padding: 0.4rem 1rem; 
      border-radius: 20px; 
      font-size: 0.9rem; 
      background: rgba(255,255,255,0.2); 
    }
    .skill-badge.success { background: rgba(76, 175, 80, 0.3); }
    .skill-badge.warning { background: rgba(255, 152, 0, 0.3); }
    
    .interview-prep { margin-top: 1.5rem; }
    .interview-prep ul { margin-top: 0.5rem; padding-left: 1.5rem; }
    .interview-prep li { margin-bottom: 0.5rem; }
    
    .job-description, .required-skills, .salary-info, .application-section { 
      margin-bottom: 2rem; 
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }
    
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-group textarea, .form-group input { 
      width: 100%; 
      padding: 0.75rem; 
      border: 1px solid #ddd; 
      border-radius: 4px; 
      font-family: inherit;
    }
    .form-group textarea:focus, .form-group input:focus { 
      outline: none; 
      border-color: #667eea; 
    }
    
    .submit-btn { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 1rem 2rem; 
      border: none; 
      border-radius: 8px; 
      font-size: 1rem; 
      font-weight: 600; 
      cursor: pointer; 
      width: 100%;
    }
    .submit-btn:hover { opacity: 0.9; }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .error-message { color: #d32f2f; margin-bottom: 1rem; }
    .success-message { color: #388e3c; margin-bottom: 1rem; }
    .loading { text-align: center; padding: 4rem; }
  `]
})
export class JobDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobOfferService = inject(JobOfferService);
  private readonly candidatureService = inject(CandidatureService);
  private readonly aiService = inject(AiService);

  job = signal<JobOfferResponseDTO | null>(null);
  match = signal<JobMatchResponseDTO | null>(null);
  
  coverLetter = '';
  resumeUrl = '';
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit(): void {
    const jobId = this.route.snapshot.paramMap.get('id');
    if (jobId) {
      this.loadJob(jobId);
      this.loadMatch(jobId);
    }
  }

  loadJob(id: string): void {
    this.jobOfferService.getJobOfferById(id).subscribe({
      next: (job) => this.job.set(job),
      error: (error) => console.error('Error loading job:', error)
    });
  }

  loadMatch(jobOfferId: string): void {
    this.aiService.getMatch(jobOfferId).subscribe({
      next: (match) => this.match.set(match),
      error: (error) => console.error('Error loading match:', error)
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
    this.router.navigate(['/job-search']);
  }
}
