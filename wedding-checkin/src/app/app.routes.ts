import { Routes } from '@angular/router';

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
		path: 'admin',
		loadComponent: () => import('./pages/admin/admin.component.js').then((m) => m.AdminComponent)
	},
	{
		path: '**',
		redirectTo: ''
	}
];
