import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  protected readonly isMenuOpen = signal(false);

  toggleMenu(): void {
    this.isMenuOpen.update(value => !value);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
