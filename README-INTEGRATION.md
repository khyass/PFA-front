# JobTracker - Frontend Angular - Guide d'Intégration

## 📋 Vue d'ensemble

Application Angular moderne connectée aux microservices backend pour la gestion des offres d'emploi et candidatures.

## 🏗️ Architecture

### Backend Services
- **Auth Service** (Port 8081) - Authentification et gestion des utilisateurs
- **Job Offer Service** (Port 8082) - Gestion des offres d'emploi
- **Candidature Service** (Port 8083) - Gestion des candidatures
- **AI Service** (Port 8084) - Suggestions AI et matching
- **API Gateway** (Port 8080) - Point d'entrée unifié

### Structure Frontend

```
src/
├── app/
│   ├── core/
│   │   ├── models/           # Interfaces TypeScript (DTOs)
│   │   │   ├── auth.models.ts
│   │   │   ├── job-offer.models.ts
│   │   │   ├── candidature.models.ts
│   │   │   └── ai.models.ts
│   │   ├── services/         # Services HTTP
│   │   │   ├── auth.service.ts
│   │   │   ├── job-offer.service.ts
│   │   │   ├── candidature.service.ts
│   │   │   └── ai.service.ts
│   │   ├── guards/           # Route guards
│   │   │   ├── auth.guard.ts
│   │   │   └── role.guard.ts
│   │   └── interceptors/     # HTTP interceptors
│   │       └── auth.interceptor.ts
│   ├── pages/                # Pages composants
│   │   ├── login/
│   │   ├── signup/
│   │   ├── dashboard/        # Dashboard entreprise
│   │   ├── job-search/       # Recherche d'emploi (candidat)
│   │   ├── job-details/      # Détails + postulation
│   │   ├── jobs-list/        # Mes candidatures (candidat)
│   │   ├── add-job/          # Créer une offre (entreprise)
│   │   └── statistics/
│   └── components/
└── environments/
    ├── environment.ts
    └── environment.development.ts
```

## 🔐 Authentification

### JWT Token Management
- **Access Token**: Stocké dans `localStorage` avec clé `access_token`
- **Refresh Token**: Stocké dans `localStorage` avec clé `refresh_token`
- **Auto-refresh**: L'intercepteur HTTP gère automatiquement le refresh des tokens expirés

### Rôles utilisateurs
- `ROLE_CANDIDATE`: Accès aux fonctionnalités candidat (recherche, candidature, AI)
- `ROLE_ENTREPRISE`: Accès aux fonctionnalités entreprise (création offres, gestion candidatures)

## 📡 Services HTTP

### AuthService
```typescript
- login(request: LoginRequest): Observable<AuthResponse>
- registerCandidate(request: RegisterCandidateRequest): Observable<AuthResponse>
- registerEnterprise(request: RegisterEnterpriseRequest): Observable<AuthResponse>
- refreshToken(): Observable<AuthResponse>
- logout(): void
- getCurrentUser(): Observable<UserProfile>
- hasRole(role: UserRole): boolean
```

### JobOfferService
```typescript
- getAllJobOffers(page, size, status?, company?): Observable<Page<JobOfferResponseDTO>>
- getJobOfferById(id: string): Observable<JobOfferResponseDTO>
- getCandidaturesForJobOffer(id: string): Observable<CandidatureDTO[]>
- createJobOffer(request: JobOfferRequestDTO): Observable<JobOfferResponseDTO>
- updateJobOffer(id: string, request: JobOfferRequestDTO): Observable<JobOfferResponseDTO>
- updateJobOfferStatus(id: string, status: JobOfferStatus): Observable<JobOfferResponseDTO>
```

### CandidatureService
```typescript
- getAllCandidatures(page, size): Observable<Page<CandidatureResponseDTO>>
- getCandidatureById(id: string): Observable<CandidatureResponseDTO>
- getCandidatureTimeline(id: string): Observable<StatusHistoryDTO[]>
- createCandidature(request: CandidatureRequestDTO): Observable<CandidatureResponseDTO>
- updateCandidature(id: string, request: CandidatureUpdateDTO): Observable<CandidatureResponseDTO>
- withdrawCandidature(id: string): Observable<void>
```

### AiService
```typescript
- getSuggestions(): Observable<SuggestionsResponseDTO>
- getMatch(jobOfferId: string): Observable<JobMatchResponseDTO>
- refreshMatch(jobOfferId: string): Observable<JobMatchResponseDTO>
- getInterviewPrep(jobOfferId: string): Observable<InterviewPrepDTO>
```

## 🛣️ Routes

### Routes publiques
- `/login` - Connexion
- `/signup` - Inscription (candidat ou entreprise)

### Routes candidat (ROLE_CANDIDATE)
- `/job-search` - Recherche d'offres avec suggestions AI
- `/job-details/:id` - Détails d'une offre + formulaire de candidature
- `/jobs` - Liste des candidatures du candidat
- `/statistics` - Statistiques personnelles

### Routes entreprise (ROLE_ENTREPRISE)
- `/dashboard` - Dashboard entreprise (offres + candidatures reçues)
- `/add-job` - Créer une nouvelle offre d'emploi
- `/statistics` - Statistiques entreprise

## 🚀 Configuration et démarrage

### Configuration des environnements
Modifier `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080', // API Gateway
  authServiceUrl: 'http://localhost:8081',
  jobOfferServiceUrl: 'http://localhost:8082',
  candidatureServiceUrl: 'http://localhost:8083',
  aiServiceUrl: 'http://localhost:8084',
};
```

### Démarrage du serveur de développement
```bash
npm start
# Accessible sur http://localhost:4200
```

## 🔧 Configuration API Gateway

Exemple de configuration Spring Cloud Gateway:

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: auth-service
          uri: http://localhost:8081
          predicates:
            - Path=/auth/**
        
        - id: job-offer-service
          uri: http://localhost:8082
          predicates:
            - Path=/api/job-offers/**
        
        - id: candidature-service
          uri: http://localhost:8083
          predicates:
            - Path=/api/candidatures/**
        
        - id: ai-service
          uri: http://localhost:8084
          predicates:
            - Path=/api/ai/**
```

## 🎨 Fonctionnalités

### Pour les Candidats
- ✅ Inscription et connexion
- ✅ Recherche d'offres d'emploi avec filtres
- ✅ **Suggestions AI personnalisées** basées sur le profil
- ✅ **Score de matching AI** pour chaque offre
- ✅ **Questions d'entretien générées par AI**
- ✅ Postulation en ligne avec lettre de motivation
- ✅ Suivi des candidatures avec historique de statuts
- ✅ Tableau de bord avec statistiques

### Pour les Entreprises
- ✅ Inscription et connexion
- ✅ Création et gestion d'offres d'emploi
- ✅ Gestion des statuts d'offres (Brouillon, Publiée, Fermée, Archivée)
- ✅ Visualisation des candidatures reçues par offre
- ✅ Dashboard avec statistiques des offres
- ✅ Gestion multi-offres

## 🔒 Sécurité

### Intercepteur HTTP
- Injection automatique du token JWT dans les headers
- Gestion automatique du refresh token sur erreur 401
- Redirection vers login si le refresh échoue

### Guards
- **authGuard**: Vérifie l'authentification
- **roleGuard**: Vérifie les rôles requis pour accéder à une route

## 📊 Gestion des Erreurs

- **401 Unauthorized**: Tentative de refresh token automatique
- **409 Conflict**: Messages spécifiques (email déjà utilisé, candidature déjà envoyée)
- **0 Network Error**: Message indiquant que le serveur est inaccessible
- **Autres erreurs**: Message générique avec possibilité de retry

## 🐛 Dépannage

### CORS Errors
Configurez votre backend pour accepter `http://localhost:4200`:
```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        // ...
    }
}
```

### Token Expiré
Vérifiez:
1. La durée de vie du token dans Keycloak/Auth Service
2. La logique de refresh dans `auth.interceptor.ts`

### AI Service ne répond pas
Les suggestions AI peuvent prendre du temps. Le service retourne un status 202 Accepted pendant le calcul.

## 📚 Ressources

- [Documentation Angular](https://angular.dev)
- [RxJS Documentation](https://rxjs.dev)
- [Voir INTEGRATION_SUMMARY.md pour les détails complets](../INTEGRATION_SUMMARY.md)
