import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  
  protected readonly formData = signal({
    email: '',
    password: '',
    rememberMe: false
  });

  protected readonly isSubmitting = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly errorMessage = signal('');

  onSubmit(): void {
    this.errorMessage.set('');
    
    // Basic validation
    if (!this.formData().email || !this.formData().password) {
      this.errorMessage.set('Veuillez remplir tous les champs');
      return;
    }

    this.isSubmitting.set(true);

    const loginRequest: LoginRequest = {
      email: this.formData().email,
      password: this.formData().password
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        
        // Navigate based on roles from the response
        const roles = response.user_profile?.roles || [];
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else if (roles.includes('ENTERPRISE')) {
          this.router.navigate(['/dashboard']);
        } else if (roles.includes('CANDIDATE')) {
          this.router.navigate(['/jobs']);
        } else {
          this.router.navigate(['/jobs']);
        }
      },
      error: (error) => {
        this.isSubmitting.set(false);
        console.error('Login error:', error);
        
        if (error.status === 401) {
          this.errorMessage.set('Email ou mot de passe incorrect');
        } else if (error.status === 0) {
          this.errorMessage.set('Impossible de se connecter au serveur');
        } else {
          this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
        }
      }
    });
  }

  updateField<K extends keyof ReturnType<typeof this.formData>>(
    field: K,
    value: ReturnType<typeof this.formData>[K]
  ): void {
    this.formData.update(data => ({ ...data, [field]: value }));
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }
}
