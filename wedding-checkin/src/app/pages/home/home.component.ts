import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  loading = false;
  searched = false;
  errorMessage = '';

  constructor(
    private readonly guestService: GuestService,
    private readonly router: Router
  ) {}

  async searchGuests(): Promise<void> {
    this.errorMessage = '';
    this.loading = true;
    this.searched = true;

    try {
      this.guests = await this.guestService.searchGuestsByName(this.nameControl.value);
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Unable to search guests right now.');
      this.guests = [];
    } finally {
      this.loading = false;
    }
  }

  async onGuestAction(guest: Guest): Promise<void> {
    await this.router.navigate(['/guest', guest.id]);
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
