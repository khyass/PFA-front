import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  JobOfferRequestDTO,
  JobOfferResponseDTO,
  JobOfferStatusUpdateDTO,
  JobOfferStatus,
  Page
} from '../models/job-offer.models';
import { CandidatureDTO } from '../models/candidature.models';

@Injectable({
  providedIn: 'root'
})
export class JobOfferService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.jobOfferServiceUrl}/api/job-offers`;

  // Get all job offers with pagination and filters
  getAllJobOffers(
    page: number = 0,
    size: number = 10,
    status?: JobOfferStatus,
    company?: string,
    sortBy: string = 'publishedDate',
    sortDirection: 'asc' | 'desc' = 'desc',
    ownerId?: string
  ): Observable<Page<JobOfferResponseDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortBy},${sortDirection}`);

    if (status) {
      params = params.set('status', status);
    }
    if (company) {
      params = params.set('company', company);
    }
    if (ownerId) {
      params = params.set('ownerId', ownerId);
    }

    return this.http.get<Page<JobOfferResponseDTO>>(this.apiUrl, { params });
  }

  // Get job offer by ID
  getJobOfferById(id: string): Observable<JobOfferResponseDTO> {
    return this.http.get<JobOfferResponseDTO>(`${this.apiUrl}/${id}`);
  }

  // Get candidatures for a job offer
  getCandidaturesForJobOffer(id: string): Observable<CandidatureDTO[]> {
    return this.http.get<CandidatureDTO[]>(`${this.apiUrl}/${id}/candidatures`);
  }

  // Create a new job offer
  createJobOffer(request: JobOfferRequestDTO): Observable<JobOfferResponseDTO> {
    return this.http.post<JobOfferResponseDTO>(this.apiUrl, request);
  }

  // Update a job offer
  updateJobOffer(id: string, request: JobOfferRequestDTO): Observable<JobOfferResponseDTO> {
    return this.http.put<JobOfferResponseDTO>(`${this.apiUrl}/${id}`, request);
  }

  // Update job offer status
  updateJobOfferStatus(id: string, status: JobOfferStatus): Observable<JobOfferResponseDTO> {
    const request: JobOfferStatusUpdateDTO = { status };
    return this.http.patch<JobOfferResponseDTO>(`${this.apiUrl}/${id}/status`, request);
  }

  // Delete a job offer
  deleteJobOffer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
