import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InventoryApiService, Product } from '../core/inventory-api.service';
import { CartService } from '../core/cart.service';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  protected readonly api = inject(InventoryApiService);
  protected readonly cart = inject(CartService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly searchTerm = signal('');
  protected readonly selectedCategory = signal('all');
  protected readonly maxPrice = signal(1000);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 8;
  protected readonly recentlyAddedProductId = signal<number | null>(null);

  private readonly routeCategory = signal<string | null>(null);

  protected readonly activeCategory = computed(() => {
    const fromRoute = this.routeCategory();
    if (fromRoute) {
      return fromRoute;
    }

    return this.selectedCategory();
  });

  protected readonly filteredProducts = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const category = this.activeCategory();
    const max = this.maxPrice();

    return this.api.products().filter((product) => {
      const matchesSearch =
        search.length === 0 ||
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search);

      const matchesCategory = category === 'all' || product.categoryName === category;
      const matchesPrice = product.price <= max;

      return matchesSearch && matchesCategory && matchesPrice;
    });
  });

  protected readonly totalPages = computed(() => {
    const total = Math.ceil(this.filteredProducts().length / this.pageSize);
    return Math.max(1, total);
  });

  protected readonly featuredProducts = computed(() => {
    const current = this.currentPage();
    const start = (current - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

  protected readonly availableCategories = computed(() => {
    const categories = this.api
      .products()
      .map((product) => product.categoryName)
      .filter((name, index, all) => all.indexOf(name) === index)
      .sort((a, b) => a.localeCompare(b));

    return ['all', ...categories];
  });

  protected readonly categories = [
    { name: 'Moda', description: 'Nuevas colecciones cada semana' },
    { name: 'Hogar', description: 'Detalles que transforman espacios' },
    { name: 'Tecnologia', description: 'Gadgets de alto rendimiento' },
    { name: 'Belleza', description: 'Skincare y cuidado premium' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const category = params.get('category');
      this.routeCategory.set(category);
      this.selectedCategory.set(category ?? 'all');
      this.currentPage.set(1);
    });

    this.route.queryParamMap.subscribe((params) => {
      const page = Number(params.get('page'));
      if (!Number.isNaN(page) && page > 0) {
        this.currentPage.set(page);
      }
    });

    if (!this.api.loadingProducts() && this.api.totalProducts() === 0) {
      this.api.loadProducts(24);
    }
  }

  protected onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  protected onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCategory.set(value);
    this.currentPage.set(1);

    if (value === 'all') {
      this.router.navigate(['/'], { queryParams: { page: 1 } });
      return;
    }

    this.router.navigate(['/category', value], { queryParams: { page: 1 } });
  }

  protected onMaxPriceChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.maxPrice.set(Number.isNaN(value) ? 1000 : value);
    this.currentPage.set(1);
  }

  protected previousPage(): void {
    const next = Math.max(1, this.currentPage() - 1);
    this.currentPage.set(next);
    this.syncPageQueryParam(next);
  }

  protected nextPage(): void {
    const next = Math.min(this.totalPages(), this.currentPage() + 1);
    this.currentPage.set(next);
    this.syncPageQueryParam(next);
  }

  protected addToCart(product: Product): void {
    this.cart.addProduct(product);
    this.recentlyAddedProductId.set(product.id);

    setTimeout(() => {
      if (this.recentlyAddedProductId() === product.id) {
        this.recentlyAddedProductId.set(null);
      }
    }, 450);
  }

  private syncPageQueryParam(page: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }
}
