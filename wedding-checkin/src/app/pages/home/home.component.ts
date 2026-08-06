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
  private lastSearchTerm = '';

  guests: Guest[] = [];
  selectedGuest: Guest | null = null;
  loading = false;
  checkingIn = false;
  searched = false;
  checkInSuccess = false;
  errorMessage = '';

  constructor(private readonly guestService: GuestService) {}

  async searchGuests(): Promise<void> {
    const searchTerm = this.nameControl.value.trim();
    if (!searchTerm) {
      this.resetSearchState();
      return;
    }

    this.lastSearchTerm = searchTerm;
    this.errorMessage = '';
    this.loading = true;
    this.searched = true;
    this.checkInSuccess = false;

    try {
      const guests = await this.guestService.searchGuestsByName(searchTerm);
      if (this.lastSearchTerm !== this.nameControl.value.trim()) {
        return;
      }

      this.guests = guests;
      this.selectedGuest = null;
    } catch (error) {
      if (this.lastSearchTerm !== this.nameControl.value.trim()) {
        return;
      }

      this.errorMessage = this.getErrorMessage(error, 'Unable to search guests right now.');
      this.guests = [];
      this.selectedGuest = null;
    } finally {
      if (this.lastSearchTerm === this.nameControl.value.trim()) {
        this.loading = false;
      }
    }
  }

  clearSearch(): void {
    this.nameControl.setValue('');
    this.lastSearchTerm = '';
    this.resetSearchState();
  }

  onNameInputChange(): void {
    if (!this.nameControl.value.trim()) {
      this.lastSearchTerm = '';
      this.resetSearchState();
    }
  }

  get hasSearchTerm(): boolean {
    return this.nameControl.value.trim().length > 0;
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

  private resetSearchState(): void {
    this.guests = [];
    this.selectedGuest = null;
    this.searched = false;
    this.checkInSuccess = false;
    this.errorMessage = '';
    this.loading = false;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  }
}
