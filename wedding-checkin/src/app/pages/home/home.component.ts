import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Guest } from '../../models/guest.model';
import { GuestService } from '../../services/guest.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  readonly nameControl = new FormControl('', { nonNullable: true });

  guests: Guest[] = [];
  selectedGuest: Guest | null = null;
  loading = false;
  checkingIn = false;
  searched = false;
  checkInSuccess = false;
  errorMessage = '';

  constructor(private readonly guestService: GuestService) {}

  async searchGuests(): Promise<void> {
    this.errorMessage = '';
    this.loading = true;
    this.searched = true;
    this.checkInSuccess = false;

    try {
      this.guests = await this.guestService.searchGuestsByName(this.nameControl.value);
      this.selectedGuest = null;
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Unable to search guests right now.');
      this.guests = [];
      this.selectedGuest = null;
    } finally {
      this.loading = false;
    }
  }

  selectGuest(guest: Guest): void {
    this.errorMessage = '';
    this.checkInSuccess = false;
    this.selectedGuest = guest;
  }

  async confirmCheckIn(): Promise<void> {
    if (!this.selectedGuest || this.selectedGuest.checked_in) {
      return;
    }

    this.errorMessage = '';
    this.checkingIn = true;

    try {
      const updatedGuest = await this.guestService.setGuestCheckInStatus(this.selectedGuest.id, true);
      this.selectedGuest = updatedGuest;
      this.checkInSuccess = true;
      this.guests = this.guests.map((guest) => (guest.id === updatedGuest.id ? updatedGuest : guest));
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Unable to confirm check-in right now.');
    } finally {
      this.checkingIn = false;
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
