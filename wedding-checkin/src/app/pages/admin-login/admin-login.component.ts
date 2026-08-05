import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent {
  readonly loginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  submitting = false;
  errorMessage = '';

  constructor(
    private readonly authService: AdminAuthService,
    private readonly router: Router
  ) {
    if (typeof window !== 'undefined') {
      void this.redirectIfLoggedIn();
    }
  }

  async login(): Promise<void> {
    this.errorMessage = '';
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.submitting = true;

    try {
      await this.authService.login(
        this.loginForm.controls.email.value.trim(),
        this.loginForm.controls.password.value
      );
      await this.router.navigate(['/admin']);
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error, 'Login failed. Please check your credentials.');
    } finally {
      this.submitting = false;
    }
  }

  private async redirectIfLoggedIn(): Promise<void> {
    if (await this.authService.isLoggedIn()) {
      await this.router.navigate(['/admin']);
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}
