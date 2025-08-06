import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ForgotPasswordComponent,
        RouterTestingModule,
        HttpClientTestingModule
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate email format', () => {
    expect(component.isValidEmail('test@example.com')).toBeTruthy();
    expect(component.isValidEmail('invalid-email')).toBeFalsy();
  });

  it('should clear messages', () => {
    component.message = 'Test message';
    component.isSuccess = true;
    component.clearMessages();
    
    expect(component.message).toBe('');
    expect(component.isSuccess).toBeFalsy();
    expect(component.isError).toBeFalsy();
  });
}); 