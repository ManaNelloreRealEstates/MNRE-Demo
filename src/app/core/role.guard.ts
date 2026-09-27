import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { homeFor } from './labels';
import { UserRole } from './models';
import { ToastService } from './toast.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const user = auth.getCurrentUser();
  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  const roles = route.data['roles'] as UserRole[] | undefined;
  if (!roles || user.role === 'admin' || roles.includes(user.role)) return true;
  toast.show('That area belongs to a different role.', 'error');
  return router.createUrlTree([homeFor(user.role)]);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser();
  if (!user) return true;
  return router.createUrlTree([homeFor(user.role)]);
};
