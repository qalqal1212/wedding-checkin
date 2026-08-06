import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminLogoutGuard: CanDeactivateFn<unknown> = async () => {
  const authService = inject(AdminAuthService);

  try {
    await authService.logout();
  } catch {
    // Ignore logout failures during route changes.
  }

  return true;
};