import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService, NotificationDTO } from '../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly isMenuOpen = signal(false);
  protected readonly showNotifications = signal(false);
  private pollInterval: any;

  ngOnInit(): void {
    if (this.isCandidate()) {
      this.notificationService.loadUnreadCount();
      this.notificationService.loadNotifications();
      this.pollInterval = setInterval(() => {
        this.notificationService.loadUnreadCount();
      }, 30000);
    }
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  isCandidate(): boolean {
    return this.authService.isCandidate();
  }

  isEnterprise(): boolean {
    return this.authService.isEnterprise();
  }

  toggleMenu(): void {
    this.isMenuOpen.update(value => !value);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
    if (this.showNotifications()) {
      this.notificationService.loadNotifications();
    }
  }

  markAsRead(notification: NotificationDTO): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        this.notificationService.loadNotifications();
        this.notificationService.loadUnreadCount();
      });
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notificationService.loadNotifications();
      this.notificationService.loadUnreadCount();
    });
  }
}
