import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.candidatureServiceUrl}/api/notifications`;

  readonly unreadCount = signal(0);
  readonly notifications = signal<NotificationDTO[]>([]);

  loadNotifications(): void {
    this.http.get<NotificationDTO[]>(this.apiUrl).subscribe({
      next: (data) => this.notifications.set(data),
      error: () => {}
    });
  }

  loadUnreadCount(): void {
    this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`).subscribe({
      next: (data) => this.unreadCount.set(data.count),
      error: () => {}
    });
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mark-all-read`, {});
  }
}
