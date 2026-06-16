import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RegisterCandidateRequest, RegisterEnterpriseRequest } from '../../core/models/auth.models';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  
  protected readonly accountType = signal<'candidate' | 'enterprise'>('candidate');
  
  protected readonly formData = signal({
    // Common fields
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    acceptTerms: false,
    
    // Candidate fields
    firstName: '',
    lastName: '',
    
    // Enterprise fields
    companyName: '',
    contactName: '',
    website: ''
  });

  protected readonly isSubmitting = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly passwordStrength = signal<'weak' | 'medium' | 'strong'>('weak');

  onSubmit(): void {
    this.errorMessage.set('');

    // Basic validation
    if (!this.formData().email || !this.formData().password) {
      this.errorMessage.set('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (this.formData().password !== this.formData().confirmPassword) {
      this.errorMessage.set('Les mots de passe ne correspondent pas');
      return;
    }

    if (!this.formData().acceptTerms) {
      this.errorMessage.set('Vous devez accepter les conditions d\'utilisation');
      return;
    }

    // Specific validation based on account type
    if (this.accountType() === 'candidate') {
      if (!this.formData().firstName || !this.formData().lastName) {
        this.errorMessage.set('Veuillez renseigner votre prénom et nom');
        return;
      }
    } else {
      if (!this.formData().companyName || !this.formData().contactName) {
        this.errorMessage.set('Veuillez renseigner le nom de l\'entreprise et le contact');
        return;
      }
    }

    this.isSubmitting.set(true);

    if (this.accountType() === 'candidate') {
      this.registerCandidate();
    } else {
      this.registerEnterprise();
    }
  }

  private registerCandidate(): void {
    const request: RegisterCandidateRequest = {
      email: this.formData().email,
      password: this.formData().password,
      firstName: this.formData().firstName,
      lastName: this.formData().lastName,
      phoneNumber: this.formData().phoneNumber || undefined
    };

    this.authService.registerCandidate(request).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        // User is auto-logged in, redirect to candidate dashboard
        this.router.navigate(['/jobs']);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        console.error('Registration error:', error);
        
        if (error.status === 409) {
          this.errorMessage.set('Un compte avec cet email existe déjà');
        } else if (error.status === 0) {
          this.errorMessage.set('Impossible de se connecter au serveur');
        } else {
          this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
        }
      }
    });
  }

  private registerEnterprise(): void {
    const request: RegisterEnterpriseRequest = {
      email: this.formData().email,
      password: this.formData().password,
      companyName: this.formData().companyName,
      contactName: this.formData().contactName,
      phoneNumber: this.formData().phoneNumber || undefined,
      website: this.formData().website || undefined
    };

    this.authService.registerEnterprise(request).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        // User is auto-logged in, redirect to enterprise dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        console.error('Registration error:', error);
        
        if (error.status === 409) {
          this.errorMessage.set('Un compte avec cet email existe déjà');
        } else if (error.status === 0) {
          this.errorMessage.set('Impossible de se connecter au serveur');
        } else {
          this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
        }
      }
    });
  }

  setAccountType(type: 'candidate' | 'enterprise'): void {
    this.accountType.set(type);
  }

  updateField<K extends keyof ReturnType<typeof this.formData>>(
    field: K,
    value: ReturnType<typeof this.formData>[K]
  ): void {
    this.formData.update(data => ({ ...data, [field]: value }));
    
    // Update password strength when password changes
    if (field === 'password') {
      this.updatePasswordStrength(value as string);
    }
  }

  updatePasswordStrength(password: string): void {
    const length = password.length;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);

    const score = (length >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + 
                  (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);

    if (score <= 2) {
      this.passwordStrength.set('weak');
    } else if (score <= 4) {
      this.passwordStrength.set('medium');
    } else {
      this.passwordStrength.set('strong');
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(value => !value);
  }
}
