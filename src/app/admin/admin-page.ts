import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryApiService } from '../core/inventory-api.service';

@Component({
  selector: 'app-admin-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPage {
  protected readonly api = inject(InventoryApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly loginForm = this.fb.nonNullable.group({
    username: ['admin', [Validators.required]],
    password: ['Admin1234!', [Validators.required]],
  });

  protected login(): void {
    if (this.loginForm.invalid) {
      this.api.error.set('Completa usuario y password para iniciar sesion.');
      return;
    }

    const { username, password } = this.loginForm.getRawValue();
    this.api.login(username, password);
  }
}
