import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JobOfferService } from '../../core/services/job-offer.service';
import { AuthService } from '../../core/services/auth.service';
import { JobOfferRequestDTO, JobOfferStatus } from '../../core/models/job-offer.models';

@Component({
  selector: 'app-add-job',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-job.component.html',
  styleUrls: ['./add-job.component.css']
})
export class AddJobComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly jobOfferService = inject(JobOfferService);
  private readonly authService = inject(AuthService);

  protected readonly formData = signal({
    title: '',
    companyName: '',
    notes: '',
    status: JobOfferStatus.OPEN
  });

  ngOnInit(): void {
    const profile = this.authService.getUserProfile();
    if (profile?.attributes?.['companyName']?.[0]) {
      this.formData.update(data => ({ ...data, companyName: profile.attributes['companyName'][0] }));
    } else if (profile?.firstName) {
      this.formData.update(data => ({ ...data, companyName: profile.firstName! }));
    }
  }

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  // Enum values for dropdowns
  protected readonly statuses = Object.values(JobOfferStatus);

  onSubmit(): void {
    this.errorMessage.set('');

    // Validation
    if (!this.formData().title || !this.formData().companyName) {
      this.errorMessage.set('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isSubmitting.set(true);

    const request: JobOfferRequestDTO = {
      title: this.formData().title,
      companyName: this.formData().companyName,
      status: this.formData().status,
      notes: this.formData().notes || undefined
    };

    console.log('Submitting job offer:', request);

    this.jobOfferService.createJobOffer(request).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        alert('Offre d\'emploi créée avec succès!');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        console.error('Error creating job offer:', error);
        this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }

  updateField<K extends keyof ReturnType<typeof this.formData>>(
    field: K,
    value: ReturnType<typeof this.formData>[K]
  ): void {
    this.formData.update(data => ({ ...data, [field]: value }));
  }
}
