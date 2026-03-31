import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./home/home-page').then((m) => m.HomePage),
	},
	{
		path: 'category/:category',
		loadComponent: () => import('./home/home-page').then((m) => m.HomePage),
	},
	{
		path: 'product/:id',
		loadComponent: () =>
			import('./product-detail/product-detail-page').then((m) => m.ProductDetailPage),
	},
	{
		path: 'cart',
		loadComponent: () => import('./cart/cart-page').then((m) => m.CartPage),
	},
	{
		path: 'checkout',
		loadComponent: () => import('./checkout/checkout-page').then((m) => m.CheckoutPage),
	},
	{
		path: 'admin',
		loadComponent: () => import('./admin/admin-page').then((m) => m.AdminPage),
	},
	{
		path: '**',
		redirectTo: '',
	},
];
