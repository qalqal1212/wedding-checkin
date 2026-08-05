import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./pages/home/home.component.js').then((m) => m.HomeComponent)
	},
	{
		path: 'guest/:id',
		loadComponent: () => import('./pages/guest-details/guest-details.component.js').then((m) => m.GuestDetailsComponent)
	},
	{
		path: 'admin/login',
		loadComponent: () => import('./pages/admin-login/admin-login.component.js').then((m) => m.AdminLoginComponent)
	},
	{
		path: 'admin',
		canActivate: [adminGuard],
		loadComponent: () => import('./pages/admin/admin.component.js').then((m) => m.AdminComponent)
	},
	{
		path: '**',
		redirectTo: ''
	}
];
