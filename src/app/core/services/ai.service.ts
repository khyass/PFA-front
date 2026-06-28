import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SuggestionsResponseDTO,
  JobMatchResponseDTO,
  InterviewPrepDTO,
  SuggestOffersRequest,
  OfferSuggestionResponse,
  InterviewPrepRequest,
  InterviewPrepResponse
} from '../models/ai.models';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.aiServiceUrl}/api/ai`;

  // Get AI-powered job suggestions for the authenticated candidate
  getSuggestions(): Observable<SuggestionsResponseDTO> {
    return this.http.get<SuggestionsResponseDTO>(`${this.apiUrl}/suggestions`);
  }

  // Get detailed match result for a specific job offer
  getMatch(jobOfferId: string): Observable<JobMatchResponseDTO> {
    return this.http.get<JobMatchResponseDTO>(`${this.apiUrl}/match/${jobOfferId}`);
  }

  // Force recompute the match for a job offer (bypass cache)
  refreshMatch(jobOfferId: string): Observable<JobMatchResponseDTO> {
    return this.http.post<JobMatchResponseDTO>(`${this.apiUrl}/match/${jobOfferId}/refresh`, {});
  }

  // Get AI-generated interview questions for a job offer
  getInterviewPrep(jobOfferId: string): Observable<InterviewPrepDTO> {
    return this.http.get<InterviewPrepDTO>(`${this.apiUrl}/interview-prep/${jobOfferId}`);
  }

  // Keyword-based offer suggestions
  suggestOffers(keywords: string[]): Observable<OfferSuggestionResponse[]> {
    const request: SuggestOffersRequest = { keywords };
    return this.http.post<OfferSuggestionResponse[]>(`${this.apiUrl}/suggest-offers`, request);
  }

  // AI-powered interview preparation with structured Q&A
  generateInterviewPrep(offerId: string, forceRefresh = false): Observable<InterviewPrepResponse> {
    const request: InterviewPrepRequest = { offerId, forceRefresh };
    return this.http.post<InterviewPrepResponse>(`${this.apiUrl}/interview-prep`, request);
  }
}
