import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Guest } from '../../models/guest.model';
import { GuestService } from '../../services/guest.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  readonly searchControl = new FormControl('', { nonNullable: true });

  guests: Guest[] = [];
  loading = false;
  errorMessage = '';

  constructor(private readonly guestService: GuestService) {
    void this.loadGuests();
  }

  get checkedInCount(): number {
    return this.guests.filter((guest) => guest.checked_in).length;
  }

  get pendingCount(): number {
    return this.guests.filter((guest) => !guest.checked_in).length;
  }

  async loadGuests(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      this.guests = await this.guestService.getGuestsForAdmin(this.searchControl.value);
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Unable to load guest status right now.');
      this.guests = [];
    } finally {
      this.loading = false;
    }
  }

  trackByGuest(_: number, guest: Guest): string {
    return guest.id;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  }
}
