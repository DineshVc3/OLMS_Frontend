import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseApiUrl = 'http://localhost:5255/api/Login'; // Base API URL
  private loginUrl = `${this.baseApiUrl}/login`;
  private forgotPasswordUrl = `${this.baseApiUrl}/forgotPassword`;
  private resetPasswordUrl = `${this.baseApiUrl}/resetPassword`;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.loginUrl}`, { Email: email, Password: password });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.forgotPasswordUrl}`, `"${email}"`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  resetPassword(token: string, password: string): Observable<any> {
    const payload = {
      Token: token,
      Password: password
    };
    
    console.log('🔄 Reset Password Request:', {
      url: this.resetPasswordUrl,
      payload: payload
    });
    
    return this.http.post(`${this.resetPasswordUrl}`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  logout() {
    // Clear all stored user data
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('userId');
    
    // Navigate to login page
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  getRole(): string | null {
    return sessionStorage.getItem('role');
  }

  getEmail(): string | null {
    return sessionStorage.getItem('email');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
