import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ResetPasswordComponent,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ token: 'test-token' })
          }
        }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate password strength', () => {
    component.password = '123';
    expect(component.getPasswordStrength()).toBe('weak');
    
    component.password = '1234567';
    expect(component.getPasswordStrength()).toBe('medium');
    
    component.password = 'StrongPass123';
    expect(component.getPasswordStrength()).toBe('strong');
  });

  it('should validate form correctly', () => {
    component.password = '';
    component.confirmPassword = '';
    expect(component.validateForm()).toBeFalsy();
    
    component.password = 'password123';
    component.confirmPassword = 'password123';
    expect(component.validateForm()).toBeTruthy();
    
    component.password = 'password123';
    component.confirmPassword = 'different';
    expect(component.validateForm()).toBeFalsy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalsy();
    component.togglePasswordVisibility('password');
    expect(component.showPassword).toBeTruthy();
    
    expect(component.showConfirmPassword).toBeFalsy();
    component.togglePasswordVisibility('confirm');
    expect(component.showConfirmPassword).toBeTruthy();
  });
}); 