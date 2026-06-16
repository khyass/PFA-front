import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly showNavbar = signal(false);

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Check current route and update navbar visibility
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const currentUrl = this.router.url;
        this.showNavbar.set(!currentUrl.includes('/login') && !currentUrl.includes('/signup'));
      });

    // Initial check
    const currentUrl = this.router.url;
    this.showNavbar.set(!currentUrl.includes('/login') && !currentUrl.includes('/signup'));
  }
}
