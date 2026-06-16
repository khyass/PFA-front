import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JobOfferService } from '../../core/services/job-offer.service';
import { JobOfferRequestDTO, ContractType, ExperienceLevel, JobOfferStatus } from '../../core/models/job-offer.models';

@Component({
  selector: 'app-add-job',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-job.component.html',
  styleUrls: ['./add-job.component.css']
})
export class AddJobComponent {
  private readonly router = inject(Router);
  private readonly jobOfferService = inject(JobOfferService);

  protected readonly formData = signal({
    title: '',
    companyName: '',
    description: '',
    location: '',
    contractType: ContractType.CDI,
    salaryMin: null as number | null,
    salaryMax: null as number | null,
    requiredSkills: [] as string[],
    experienceLevel: ExperienceLevel.INTERMEDIATE,
    status: JobOfferStatus.PUBLISHED
  });

  protected readonly skillInput = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  // Enum values for dropdowns
  protected readonly contractTypes = Object.values(ContractType);
  protected readonly experienceLevels = Object.values(ExperienceLevel);
  protected readonly statuses = Object.values(JobOfferStatus);

  onSubmit(): void {
    this.errorMessage.set('');

    // Validation
    if (!this.formData().title || !this.formData().companyName || !this.formData().description) {
      this.errorMessage.set('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (this.formData().requiredSkills.length === 0) {
      this.errorMessage.set('Veuillez ajouter au moins une compétence requise');
      return;
    }

    this.isSubmitting.set(true);

    const request: JobOfferRequestDTO = {
      title: this.formData().title,
      companyName: this.formData().companyName,
      description: this.formData().description,
      location: this.formData().location,
      contractType: this.formData().contractType,
      salaryMin: this.formData().salaryMin ?? undefined,
      salaryMax: this.formData().salaryMax ?? undefined,
      requiredSkills: this.formData().requiredSkills,
      experienceLevel: this.formData().experienceLevel,
      status: this.formData().status
    };

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

  addSkill(): void {
    const skill = this.skillInput().trim();
    if (skill && !this.formData().requiredSkills.includes(skill)) {
      this.formData.update(data => ({
        ...data,
        requiredSkills: [...data.requiredSkills, skill]
      }));
      this.skillInput.set('');
    }
  }

  removeSkill(skill: string): void {
    this.formData.update(data => ({
      ...data,
      requiredSkills: data.requiredSkills.filter(s => s !== skill)
    }));
  }
}
