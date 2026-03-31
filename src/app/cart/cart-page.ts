import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';

@Component({
  selector: 'app-cart-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  protected readonly cart = inject(CartService);
  protected readonly pageLoading = signal(true);

  protected readonly shipping = computed(() =>
    this.cart.itemCount() === 0 ? 0 : 7.99
  );

  protected readonly total = computed(() => this.cart.subtotal() + this.shipping());

  constructor() {
    setTimeout(() => this.pageLoading.set(false), 320);
  }

  protected increment(productId: number, currentQty: number): void {
    this.cart.updateQuantity(productId, currentQty + 1);
  }

  protected decrement(productId: number, currentQty: number): void {
    this.cart.updateQuantity(productId, currentQty - 1);
  }
}
