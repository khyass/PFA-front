import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/auth.models';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'Connexion - JobTracker'
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup.component').then(m => m.SignupComponent),
    title: 'Inscription - JobTracker'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard, roleGuard([UserRole.ENTREPRISE])],
    title: 'Dashboard Entreprise - JobTracker'
  },
  {
    path: 'add-job',
    loadComponent: () => import('./pages/add-job/add-job.component').then(m => m.AddJobComponent),
    canActivate: [authGuard, roleGuard([UserRole.ENTREPRISE])],
    title: 'Créer une Offre - JobTracker'
  },
  {
    path: 'job-search',
    loadComponent: () => import('./pages/job-search/job-search.component').then(m => m.JobSearchComponent),
    canActivate: [authGuard, roleGuard([UserRole.CANDIDATE])],
    title: 'Rechercher un Emploi - JobTracker'
  },
  {
    path: 'job-details/:id',
    loadComponent: () => import('./pages/job-details/job-details.component').then(m => m.JobDetailsComponent),
    canActivate: [authGuard, roleGuard([UserRole.CANDIDATE])],
    title: 'Détails de l\'Offre - JobTracker'
  },
  {
    path: 'jobs',
    loadComponent: () => import('./pages/jobs-list/jobs-list.component').then(m => m.JobsListComponent),
    canActivate: [authGuard, roleGuard([UserRole.CANDIDATE])],
    title: 'Mes Candidatures - JobTracker'
  },
  {
    path: 'statistics',
    loadComponent: () => import('./pages/statistics/statistics.component').then(m => m.StatisticsComponent),
    canActivate: [authGuard],
    title: 'Statistiques - JobTracker'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
