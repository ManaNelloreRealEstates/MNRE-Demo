import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { BuyerService } from '../core/buyer.service';
import { ToastService } from '../core/toast.service';

@Injectable({ providedIn: 'root' })
export class CatalogActions {
  private readonly auth = inject(AuthService);
  private readonly buyer = inject(BuyerService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  isSaved(propertyId: string): boolean {
    const user = this.auth.getCurrentUser();
    if (!user || user.role !== 'buyer') return false;
    return this.buyer.isSaved(user.id, propertyId);
  }

  save(propertyId: string): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (user.role !== 'buyer') {
      this.toast.show('Saving is part of the buyer journey. Sign in as a buyer to keep a shortlist.', 'info');
      return;
    }
    const saved = this.buyer.toggleFavorite(user.id, propertyId);
    this.toast.show(saved ? 'Saved to your shortlist.' : 'Removed from saved properties.');
  }

  async share(propertyId: string): Promise<void> {
    const url = `${location.origin}/property/${propertyId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ManaNelloreRealEstate', url });
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      this.toast.show('Property link copied.');
    } catch {
      this.toast.show(url, 'info');
    }
  }
}
