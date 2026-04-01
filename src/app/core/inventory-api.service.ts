import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { SessionStoreService } from './session-store.service';

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  username: string;
  role: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface ApiErrorResponse {
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  path?: string;
}

export interface ProductQuery {
  page?: number;
  size?: number;
  search?: string;
  categoryId?: number;
  maxPrice?: number;
}

export interface OrderSummary {
  id: number;
  orderNumber?: string;
  status?: string;
  total?: number;
  createdAt?: string;
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
  private readonly httpBackend = inject(HttpBackend);
  private readonly rawHttp = new HttpClient(this.httpBackend);
  private readonly session = inject(SessionStoreService);
  private readonly apiBaseUrl = environment.apiUrl
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

  readonly token = this.session.token;
  readonly error = signal('');
  readonly products = signal<Product[]>([]);
  readonly loadingProducts = signal(false);
  readonly creatingProduct = signal(false);
  readonly isAuthenticated = this.session.isAuthenticated;
  readonly isAdmin = this.session.isAdmin;
  readonly totalProducts = computed(() => this.products().length);

  login(username: string, password: string): void {
    this.error.set('');

    this.rawHttp
      .post<LoginResponse>(`${this.apiBaseUrl}/api/auth/login`, {
        username,
        password,
      })
      .subscribe({
        next: (res) => {
          this.session.setSession({
            token: res.token,
            refreshToken: res.refreshToken ?? '',
            username: res.username,
            role: res.role,
          });
          this.loadProducts();
        },
        error: (err) => {
          this.error.set(this.toApiErrorMessage(err, 'No se pudo iniciar sesion. Verifica usuario y password.'));
        },
      });
  }

  register(payload: RegisterPayload): Observable<LoginResponse> {
    return this.rawHttp.post<LoginResponse>(`${this.apiBaseUrl}/api/auth/register`, payload).pipe(
      tap((response) => {
        this.session.setSession({
          token: response.token,
          refreshToken: response.refreshToken ?? '',
          username: response.username,
          role: response.role,
        });
      }),
    );
  }

  refresh(refreshToken: string): Observable<LoginResponse> {
    return this.rawHttp.post<LoginResponse>(`${this.apiBaseUrl}/api/auth/refresh`, { refreshToken }).pipe(
      tap((response) => {
        this.session.setSession({
          token: response.token,
          refreshToken: response.refreshToken ?? refreshToken,
          username: response.username,
          role: response.role,
        });
      }),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiBaseUrl}/api/auth/logout`, {}).pipe(
      tap(() => this.session.clearSession()),
    );
  }

  me(): Observable<{ username: string; role: string; email?: string }> {
    return this.http.get<{ username: string; role: string; email?: string }>(`${this.apiBaseUrl}/api/auth/me`);
  }

  loadProducts(optionsOrSize: number | ProductQuery = 24): void {
    this.loadingProducts.set(true);
    this.error.set('');

    const options: ProductQuery =
      typeof optionsOrSize === 'number'
        ? { size: optionsOrSize }
        : optionsOrSize;

    const query = new URLSearchParams();
    query.set('size', String(options.size ?? 24));

    if (typeof options.page === 'number') {
      query.set('page', String(options.page));
    }
    if (options.search) {
      query.set('search', options.search);
    }
    if (typeof options.categoryId === 'number') {
      query.set('categoryId', String(options.categoryId));
    }
    if (typeof options.maxPrice === 'number') {
      query.set('maxPrice', String(options.maxPrice));
    }

    this.http
      .get<PagedProducts>(`${this.apiBaseUrl}/api/products?${query.toString()}`)
      .subscribe({
        next: (res) => {
          this.products.set(res.content);
          this.loadingProducts.set(false);
        },
        error: (err) => {
          this.error.set(this.toApiErrorMessage(err, 'No se pudo cargar el listado de productos.'));
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

    const payload = {
      name: `Demo Product ${Math.floor(Math.random() * 10000)}`,
      description: 'Producto generado desde el frontend Angular',
      price: Number((50 + Math.random() * 300).toFixed(2)),
      stock: Math.floor(Math.random() * 100) + 1,
      categoryId: 1,
    };

    this.http
      .post<Product>(`${this.apiBaseUrl}/api/products`, payload)
      .subscribe({
        next: () => {
          this.creatingProduct.set(false);
          this.loadProducts();
        },
        error: (err) => {
          this.creatingProduct.set(false);
          this.error.set(this.toApiErrorMessage(err, 'No se pudo crear el producto demo. Revisa el token o categoryId.'));
        },
      });
  }

  myOrders(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(`${this.apiBaseUrl}/api/orders/my`);
  }

  createOrder(payload: PlaceOrderPayload): Observable<PlaceOrderResponse> {
    return this.http.post<PlaceOrderResponse>(`${this.apiBaseUrl}/api/orders`, payload);
  }

  placeOrder(payload: PlaceOrderPayload): Observable<PlaceOrderResponse> {
    return this.createOrder(payload);
  }

  clearSession(): void {
    this.session.clearSession();
  }

  private toApiErrorMessage(err: unknown, fallback: string): string {
    const apiError = (err as { error?: ApiErrorResponse })?.error;
    return apiError?.message ?? fallback;
  }
}
