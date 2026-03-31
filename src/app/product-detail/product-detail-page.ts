import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';
import { InventoryApiService } from '../core/inventory-api.service';

@Component({
  selector: 'app-product-detail-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly api = inject(InventoryApiService);
  protected readonly cart = inject(CartService);

  private readonly productId = signal<number | null>(null);

  protected readonly product = computed(() => {
    const id = this.productId();
    if (id === null) {
      return undefined;
    }

    return this.api.products().find((item) => item.id === id);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      this.productId.set(Number.isNaN(id) ? null : id);
    });

    if (this.api.totalProducts() === 0) {
      this.api.loadProducts(100);
    }
  }

  protected addToCart(): void {
    const currentProduct = this.product();
    if (!currentProduct) {
      return;
    }

    this.cart.addProduct(currentProduct);
  }
}
