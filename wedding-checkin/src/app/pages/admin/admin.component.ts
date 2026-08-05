import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Guest } from '../../models/guest.model';
import { AdminAuthService } from '../../services/admin-auth.service';
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
  totalGuests = 0;
  checkedInCount = 0;
  pendingCount = 0;
  readonly pageSize = 20;
  currentPage = 1;

  loading = false;
  saving = false;
  deletingGuestId: string | null = null;
  togglingGuestId: string | null = null;
  editingGuestId: string | null = null;
  errorMessage = '';

  constructor(
    private readonly guestService: GuestService,
    private readonly adminAuthService: AdminAuthService,
    private readonly router: Router
  ) {
    if (typeof window !== 'undefined') {
      void this.loadGuests();
    }
  }

  get totalPages(): number {
    const pages = Math.ceil(this.totalGuests / this.pageSize);
    return pages > 0 ? pages : 1;
  }

  async loadGuests(resetPage = false): Promise<void> {
    if (resetPage) {
      this.currentPage = 1;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const result = await this.guestService.getGuestsForAdmin(
        this.searchControl.value,
        this.currentPage,
        this.pageSize
      );
      this.guests = result.guests;
      this.totalGuests = result.total;
      this.checkedInCount = result.checkedInCount;
      this.pendingCount = result.pendingCount;

      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
        return await this.loadGuests();
      }
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Unable to load guest status right now.');
      this.guests = [];
      this.totalGuests = 0;
      this.checkedInCount = 0;
      this.pendingCount = 0;
    } finally {
      this.loading = false;
    }
  }

  async clearSearch(): Promise<void> {
    this.searchControl.setValue('');
    await this.loadGuests(true);
  }

  async nextPage(): Promise<void> {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage += 1;
    await this.loadGuests();
  }

  async previousPage(): Promise<void> {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage -= 1;
    await this.loadGuests();
  }

  async toggleCheckIn(guest: Guest): Promise<void> {
    this.errorMessage = '';
    this.togglingGuestId = guest.id;

    try {
      await this.guestService.setGuestCheckInStatus(guest.id, !guest.checked_in);
      await this.loadGuests();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Unable to update check-in status right now.');
    } finally {
      this.togglingGuestId = null;
    }
  }

  async logoutAdmin(): Promise<void> {
    await this.adminAuthService.logout();
    await this.router.navigate(['/admin/login']);
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
    const wasEditing = !!this.editingGuestId;

    try {
      if (this.editingGuestId) {
        await this.guestService.updateGuest(this.editingGuestId, payload);
      } else {
        await this.guestService.createGuest(payload);
      }

      this.startCreateGuest();
      await this.loadGuests(!wasEditing);
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

  get hasSearchTerm(): boolean {
    return this.searchControl.value.trim().length > 0;
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
