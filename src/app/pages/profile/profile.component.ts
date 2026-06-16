import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/models/auth.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    const storedProfile = this.authService.getUserProfile();
    if (storedProfile) {
      this.profile.set(storedProfile);
    }
    this.loading.set(false);
  }

  getFullName(): string {
    const p = this.profile();
    if (!p) return '';
    return [p.firstName, p.lastName].filter(Boolean).join(' ');
  }

  getRoleLabel(): string {
    const p = this.profile();
    if (!p?.roles?.length) return '';
    if (p.roles.includes('ENTERPRISE')) return 'Entreprise';
    if (p.roles.includes('CANDIDATE')) return 'Candidat';
    return p.roles[0];
  }

  getAttribute(key: string): string {
    const attrs = this.profile()?.attributes;
    if (!attrs || !attrs[key]) return '';
    return Array.isArray(attrs[key]) ? attrs[key].join(', ') : attrs[key];
  }

  getAttributeKeys(): string[] {
    const attrs = this.profile()?.attributes;
    if (!attrs) return [];
    return Object.keys(attrs);
  }

  logout(): void {
    this.authService.logout();
  }
}
