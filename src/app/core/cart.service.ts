import { Injectable, computed, inject, signal } from '@angular/core';
import { Product } from './inventory-api.service';
import { ToastService } from './toast.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storageKey = 'mercat_cart_v1';
  private readonly toast = inject(ToastService);

  readonly items = signal<CartItem[]>([]);

  readonly itemCount = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this.items().reduce((total, item) => total + item.product.price * item.quantity, 0)
  );

  constructor() {
    this.hydrateFromStorage();
  }

  addProduct(product: Product): void {
    const existing = this.items().find((item) => item.product.id === product.id);

    if (!existing) {
      this.items.update((current) => [...current, { product, quantity: 1 }]);
      this.persist();
      this.toast.show(`${product.name} agregado al carrito`);
      return;
    }

    this.items.update((current) =>
      current.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
    this.persist();
    this.toast.show(`Actualizaste ${product.name} en el carrito`);
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeProduct(productId);
      return;
    }

    this.items.update((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
    this.persist();
  }

  removeProduct(productId: number): void {
    this.items.update((current) =>
      current.filter((item) => item.product.id !== productId)
    );
    this.persist();
  }

  clear(): void {
    this.items.set([]);
    this.persist();
  }

  private hydrateFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as CartItem[];
      if (!Array.isArray(parsed)) {
        return;
      }

      const sanitized = parsed.filter(
        (item) =>
          item &&
          typeof item.quantity === 'number' &&
          item.quantity > 0 &&
          typeof item.product?.id === 'number'
      );

      this.items.set(sanitized);
    } catch {
      this.items.set([]);
    }
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(this.items()));
  }
}
