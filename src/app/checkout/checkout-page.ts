import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';
import { InventoryApiService } from '../core/inventory-api.service';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-checkout-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage {
  protected readonly cart = inject(CartService);
  private readonly api = inject(InventoryApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storageKey = 'mercat_checkout_form_v1';

  protected readonly shipping = computed(() =>
    this.cart.itemCount() === 0 ? 0 : 7.99
  );

  protected readonly total = computed(() => this.cart.subtotal() + this.shipping());

  protected readonly checkoutForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required]],
    city: ['', [Validators.required]],
    postalCode: ['', [Validators.required]],
  });

  protected readonly orderPlaced = signal(false);
  protected readonly orderNumber = signal('');
  protected readonly placingOrder = signal(false);
  protected readonly error = signal('');
  protected readonly pageLoading = signal(true);

  constructor() {
    this.hydrateForm();

    setTimeout(() => this.pageLoading.set(false), 320);

    this.checkoutForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (typeof localStorage === 'undefined') {
          return;
        }
        localStorage.setItem(this.storageKey, JSON.stringify(value));
      });
  }

  protected placeOrder(): void {
    if (this.checkoutForm.invalid || this.cart.itemCount() === 0) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.error.set('');
    this.placingOrder.set(true);

    const formValue = this.checkoutForm.getRawValue();

    this.api
      .placeOrder({
        customerName: formValue.fullName,
        customerEmail: formValue.email,
        address: formValue.address,
        city: formValue.city,
        postalCode: formValue.postalCode,
        items: this.cart.items().map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const fallback = `MC-${Math.floor(100000 + Math.random() * 900000)}`;
          this.orderNumber.set(response.orderNumber ?? response.id?.toString() ?? fallback);
          this.orderPlaced.set(true);
          this.placingOrder.set(false);
          this.cart.clear();
          this.checkoutForm.reset({
            fullName: '',
            email: '',
            address: '',
            city: '',
            postalCode: '',
          });
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(this.storageKey);
          }
          this.toast.show('Pedido creado correctamente');
        },
        error: () => {
          this.placingOrder.set(false);
          this.error.set('No se pudo crear la orden. Revisa la API de pedidos.');
        },
      });
  }

  private hydrateForm(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return;
      }

      const data = JSON.parse(raw) as Partial<Record<string, string>>;
      this.checkoutForm.patchValue({
        fullName: data['fullName'] ?? '',
        email: data['email'] ?? '',
        address: data['address'] ?? '',
        city: data['city'] ?? '',
        postalCode: data['postalCode'] ?? '',
      });
    } catch {
      this.checkoutForm.reset({
        fullName: '',
        email: '',
        address: '',
        city: '',
        postalCode: '',
      });
    }
  }
}
