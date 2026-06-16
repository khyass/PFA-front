import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CandidatureRequestDTO,
  CandidatureUpdateDTO,
  CandidatureResponseDTO,
  StatusHistoryDTO,
  Page
} from '../models/candidature.models';

@Injectable({
  providedIn: 'root'
})
export class CandidatureService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/candidatures`;

  // Get all candidatures for the authenticated candidate
  getAllCandidatures(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'appliedDate',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Observable<Page<CandidatureResponseDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortBy},${sortDirection}`);

    return this.http.get<Page<CandidatureResponseDTO>>(this.apiUrl, { params });
  }

  // Get candidature by ID
  getCandidatureById(id: string): Observable<CandidatureResponseDTO> {
    return this.http.get<CandidatureResponseDTO>(`${this.apiUrl}/${id}`);
  }

  // Get candidature timeline (status history)
  getCandidatureTimeline(id: string): Observable<StatusHistoryDTO[]> {
    return this.http.get<StatusHistoryDTO[]>(`${this.apiUrl}/${id}/timeline`);
  }

  // Create a new candidature (apply to a job)
  createCandidature(request: CandidatureRequestDTO): Observable<CandidatureResponseDTO> {
    return this.http.post<CandidatureResponseDTO>(this.apiUrl, request);
  }

  // Update a candidature
  updateCandidature(id: string, request: CandidatureUpdateDTO): Observable<CandidatureResponseDTO> {
    return this.http.put<CandidatureResponseDTO>(`${this.apiUrl}/${id}`, request);
  }

  // Withdraw a candidature
  withdrawCandidature(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
