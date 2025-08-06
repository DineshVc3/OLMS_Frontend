import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppUser, UserUpdateDto, CreateUserRequest, UserRole, NumericRoleMapping } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:5255/api/AppUser';
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrentUser();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    const userId = localStorage.getItem('userId');
    
    if (!token) {
      throw new Error('Authentication token not found. Please login again.');
    }
    
    const headers: any = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    if (email) {
      headers['X-User-Email'] = email;
    }
    
    if (userId) {
      headers['X-User-Id'] = userId;
    }
    
    return new HttpHeaders(headers);
  }

  getCurrentUserFromStorage(): AppUser | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        return null;
      }
    }
    return null;
  }

  private loadCurrentUser(): void {
    const user = this.getCurrentUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
    }
    
    const email = localStorage.getItem('email');
    if (email && localStorage.getItem('token')) {
      this.fetchAndUpdateCurrentUser(email);
    }
  }

  fetchAndUpdateCurrentUser(email?: string): void {
    const userEmail = email || localStorage.getItem('email');
    if (!userEmail) {
      console.warn('No email found to fetch user profile');
      return;
    }

    this.getUserByEmail(userEmail).subscribe({
      next: (user: AppUser) => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      },
      error: (error: any) => {
        console.error('Error fetching user profile:', error);
      }
    });
  }

  getUserByEmail(email: string): Observable<AppUser> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/GetUserByEmail?email=${email}`;
    return this.http.get<any>(url, { headers }).pipe(
      map(response => this.transformApiUser(response))
    );
  }

  private transformApiUser(apiUser: any): AppUser {
    return {
      id: apiUser.id || apiUser.userId,
      userId: apiUser.userId || apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      role: apiUser.role,
      phoneNumber: apiUser.phoneNumber,
      createdBy: apiUser.createdBy,
      createdAt: apiUser.createdAt,
      modifiedBy: apiUser.modifiedBy,
      modifiedAt: apiUser.modifiedAt,
      isActive: apiUser.isActive
    };
  }

  updateUser(userData: UserUpdateDto): Observable<string> {
    const headers = this.getAuthHeaders();
    // Ensure name is provided as the API expects it
    const updateData = {
      email: userData.email,
      name: userData.name || '', // Default to empty string if not provided
      phonenumber: userData.phonenumber || '' // Use the lowercase 'n' as per user.model.ts
    };
    return this.http.put<string>(`${this.apiUrl}/UpdateUser`, updateData, { headers });
  }

  updateCurrentUser(user: AppUser): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): AppUser | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserRole(): string | null {
    return localStorage.getItem('role');
  }

  // User Management Methods
  
  // Create new user
  createUser(userData: CreateUserRequest): Observable<string> {
    const headers = this.getAuthHeaders();
    
    // Transform CreateUserRequest to AppUserDto format for API
    const apiData = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      phoneNumber: userData.phoneNumber,
      password: userData.password
    };
    
    return this.http.post(`${this.apiUrl}/CreateUsers`, apiData, { 
      headers, 
      responseType: 'text'
    });
  }

  // Get users by role
  getUsersByRole(role: UserRole): Observable<AppUser[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<AppUser[]>(`${this.apiUrl}/GetAllUserByRole?role=${role}`, { headers }).pipe(
      map(users => users.map(user => this.transformApiUser(user)))
    );
  }

  // Get all users based on current user's access level
  getAllUsersByAccess(): Observable<AppUser[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<AppUser[]>(`${this.apiUrl}/GetAllUsersByAccess`, { headers }).pipe(
      map(users => users.map(user => this.transformApiUser(user)))
    );
  }

  // Delete user
  deleteUser(email: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/DeleteUser?email=${email}`, { headers });
  }

  // Toggle user status (activate/deactivate)
  toggleUserStatus(email: string, isActive: boolean): Observable<string> {
    const headers = this.getAuthHeaders();
    const url = `${this.apiUrl}/ToggleUserStatus?email=${encodeURIComponent(email)}&isActive=${isActive}`;
    return this.http.put(url, {}, { headers, responseType: 'text' });
  }

  // Check if current user can manage specific role
  canManageRole(targetRole: UserRole): boolean {
    const currentRole = this.getCurrentUserRole();
    
    if (currentRole === UserRole.SuperAdmin || currentRole === 'SuperAdmin') {
      return true; // SuperAdmin can manage all roles
    }
    
    if (currentRole === UserRole.Admin || currentRole === 'Admin') {
      return targetRole === UserRole.Instructor || targetRole === UserRole.Learner;
    }
    
    return false;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    this.currentUserSubject.next(null);
  }
} 