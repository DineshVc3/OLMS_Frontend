export interface AppUser {
  id?: number;
  userId?: number; // API sometimes returns userId instead of id
  name: string;
  email: string;
  role: UserRole | number; // Allow both string enum and numeric role
  phoneNumber: string;
  createdBy: number;
  createdAt: string;
  modifiedBy?: number;
  modifiedAt?: string;
  isActive?: boolean;
}

export interface AppUserDto {
  name: string;
  email: string;
  role: string;
  phoneNumber: string;
  password: string;
}

export interface UserUpdateDto {
  email: string;
  name?: string;
  phonenumber?: string;
}

export enum UserRole {
  SuperAdmin = 'SuperAdmin',
  Admin = 'Admin', 
  Instructor = 'Instructor',
  Learner = 'Learner'
}

// Numeric role mapping for API responses
export const NumericRoleMapping = {
  4: UserRole.SuperAdmin,
  3: UserRole.Admin,
  2: UserRole.Instructor,
  1: UserRole.Learner
} as const;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// User Management specific interfaces
export interface CreateUserRequest {
  name: string;
  email: string;
  role: string;
  phoneNumber: string;
  password: string;
}

export interface UserListFilter {
  role: UserRole;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
} 