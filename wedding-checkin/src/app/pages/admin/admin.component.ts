import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  readonly guestForm = new FormGroup({
    guest_name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    table_name: new FormControl('', { nonNullable: true }),
    table_code: new FormControl('', { nonNullable: true }),
    seat_code: new FormControl('', { nonNullable: true }),
    seat_number: new FormControl('', { nonNullable: true }),
    original_text: new FormControl('', { nonNullable: true })
  });

  guests: Guest[] = [];
  loading = false;
  saving = false;
  deletingGuestId: string | null = null;
  editingGuestId: string | null = null;
  errorMessage = '';

  constructor(private readonly guestService: GuestService) {
    void this.loadGuests();
  }

  get withTableCount(): number {
    return this.guests.filter((guest) => !!guest.table_name).length;
  }

  get withSeatNumberCount(): number {
    return this.guests.filter((guest) => !!guest.seat_number).length;
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

  startCreateGuest(): void {
    this.editingGuestId = null;
    this.guestForm.setValue({
      guest_name: '',
      table_name: '',
      table_code: '',
      seat_code: '',
      seat_number: '',
      original_text: ''
    });
  }

  startEditGuest(guest: Guest): void {
    this.editingGuestId = guest.id;
    this.guestForm.setValue({
      guest_name: guest.guest_name,
      table_name: guest.table_name ?? '',
      table_code: guest.table_code ?? '',
      seat_code: guest.seat_code ?? '',
      seat_number: guest.seat_number ?? '',
      original_text: guest.original_text ?? ''
    });
  }

  cancelEdit(): void {
    this.startCreateGuest();
  }

  async saveGuest(): Promise<void> {
    this.errorMessage = '';
    this.guestForm.markAllAsTouched();
    if (this.guestForm.invalid) {
      return;
    }

    this.saving = true;

    const payload = {
      guest_name: this.guestForm.controls.guest_name.value.trim(),
      table_name: this.toNullable(this.guestForm.controls.table_name.value),
      table_code: this.toNullable(this.guestForm.controls.table_code.value),
      seat_code: this.toNullable(this.guestForm.controls.seat_code.value),
      seat_number: this.toNullable(this.guestForm.controls.seat_number.value),
      original_text: this.toNullable(this.guestForm.controls.original_text.value)
    };

    try {
      if (this.editingGuestId) {
        await this.guestService.updateGuest(this.editingGuestId, payload);
      } else {
        await this.guestService.createGuest(payload);
      }

      this.startCreateGuest();
      await this.loadGuests();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Unable to save guest right now.');
    } finally {
      this.saving = false;
    }
  }

  async deleteGuest(guest: Guest): Promise<void> {
    this.errorMessage = '';
    this.deletingGuestId = guest.id;

    try {
      await this.guestService.deleteGuest(guest.id);

      if (this.editingGuestId === guest.id) {
        this.startCreateGuest();
      }

      await this.loadGuests();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Unable to delete guest right now.');
    } finally {
      this.deletingGuestId = null;
    }
  }

  trackByGuest(_: number, guest: Guest): string {
    return guest.id;
  }

  get isEditing(): boolean {
    return this.editingGuestId !== null;
  }

  private toNullable(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  }
}
