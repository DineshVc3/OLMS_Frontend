import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token'); // or 'role'

  if (token) {
    return true;
  }

  // 🚨 Redirect to login if not authenticated
  router.navigate(['/login']);
  return false;
};
