import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidatureService } from '../../core/services/candidature.service';
import { CandidatureResponseDTO, CandidatureUpdateDTO, CandidatureStatus } from '../../core/models/candidature.models';

@Component({
  selector: 'app-edit-candidature',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-candidature.component.html',
  styleUrls: ['./edit-candidature.component.css']
})
export class EditCandidatureComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly candidatureService = inject(CandidatureService);

  candidature = signal<CandidatureResponseDTO | null>(null);
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  coverLetter = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCandidature(id);
    } else {
      this.router.navigate(['/jobs']);
    }
  }

  loadCandidature(id: string): void {
    this.candidatureService.getCandidatureById(id).subscribe({
      next: (candidature) => {
        if (candidature.status !== CandidatureStatus.PENDING) {
          alert('Seules les candidatures en attente peuvent être modifiées.');
          this.router.navigate(['/jobs']);
          return;
        }
        this.candidature.set(candidature);
        this.coverLetter = candidature.coverLetter;
      },
      error: () => {
        this.router.navigate(['/jobs']);
      }
    });
  }

  onSubmit(): void {
    if (!this.coverLetter.trim()) {
      this.errorMessage.set('La lettre de motivation est obligatoire');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const request: CandidatureUpdateDTO = {
      coverLetter: this.coverLetter
    };

    this.candidatureService.updateCandidature(this.candidature()!.id, request).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Candidature mise à jour avec succès!');
        setTimeout(() => this.router.navigate(['/jobs']), 1500);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/jobs']);
  }
}
