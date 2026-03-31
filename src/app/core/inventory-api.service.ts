import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryName: string;
}

export interface PlaceOrderItem {
  productId: number;
  quantity: number;
}

export interface PlaceOrderPayload {
  customerName: string;
  customerEmail: string;
  address: string;
  city: string;
  postalCode: string;
  items: PlaceOrderItem[];
}

export interface PlaceOrderResponse {
  id?: number;
  orderNumber?: string;
  status?: string;
}

interface PagedProducts {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiUrl
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

  readonly token = signal('');
  readonly error = signal('');
  readonly products = signal<Product[]>([]);
  readonly loadingProducts = signal(false);
  readonly creatingProduct = signal(false);
  readonly isAuthenticated = computed(() => this.token().length > 0);
  readonly totalProducts = computed(() => this.products().length);

  login(username: string, password: string): void {
    this.error.set('');

    this.http
      .post<LoginResponse>(`${this.apiBaseUrl}/api/auth/login`, {
        username,
        password,
      })
      .subscribe({
        next: (res) => {
          this.token.set(res.token);
          this.loadProducts();
        },
        error: () => {
          this.error.set('No se pudo iniciar sesion. Verifica usuario y password.');
        },
      });
  }

  loadProducts(size = 24): void {
    this.loadingProducts.set(true);
    this.error.set('');

    this.http
      .get<PagedProducts>(`${this.apiBaseUrl}/api/products?size=${size}`)
      .subscribe({
        next: (res) => {
          this.products.set(res.content);
          this.loadingProducts.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el listado de productos.');
          this.loadingProducts.set(false);
        },
      });
  }

  createDemoProduct(): void {
    if (!this.token()) {
      this.error.set('Necesitas iniciar sesion para crear productos.');
      return;
    }

    this.creatingProduct.set(true);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token()}`,
    });

    const payload = {
      name: `Demo Product ${Math.floor(Math.random() * 10000)}`,
      description: 'Producto generado desde el frontend Angular',
      price: Number((50 + Math.random() * 300).toFixed(2)),
      stock: Math.floor(Math.random() * 100) + 1,
      categoryId: 1,
    };

    this.http
      .post<Product>(`${this.apiBaseUrl}/api/products`, payload, { headers })
      .subscribe({
        next: () => {
          this.creatingProduct.set(false);
          this.loadProducts();
        },
        error: () => {
          this.creatingProduct.set(false);
          this.error.set('No se pudo crear el producto demo. Revisa el token o categoryId.');
        },
      });
  }

  placeOrder(payload: PlaceOrderPayload): Observable<PlaceOrderResponse> {
    const token = this.token();

    if (token) {
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      return this.http.post<PlaceOrderResponse>(`${this.apiBaseUrl}/api/orders`, payload, {
        headers,
      });
    }

    return this.http.post<PlaceOrderResponse>(`${this.apiBaseUrl}/api/orders`, payload);
  }
}
