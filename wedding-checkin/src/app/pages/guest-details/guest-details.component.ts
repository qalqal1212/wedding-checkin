import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Guest } from '../../models/guest.model';
import { GuestService } from '../../services/guest.service';

@Component({
  selector: 'app-guest-details',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './guest-details.component.html',
  styleUrl: './guest-details.component.scss'
})
export class GuestDetailsComponent {
  guest: Guest | null = null;
  loading = true;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly guestService: GuestService
  ) {
    void this.loadGuest();
  }

  async loadGuest(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Guest id is missing.';
      this.loading = false;
      return;
    }

    try {
      this.guest = await this.guestService.getGuestById(id);
      if (!this.guest) {
        this.errorMessage = 'Guest record was not found.';
      }
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Unable to load guest details right now.');
    } finally {
      this.loading = false;
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  }
}
