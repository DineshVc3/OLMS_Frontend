import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';

import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard.component';

import { SuperadminDashboardComponent } from './pages/superadmin/superadmin-dashboard/superadmin-dashboard.component';

import { InstructorDashboardComponent } from './pages/instructor/instructor-dashboard/instructor-dashboard.component';

import { LearnerDashboardComponent } from './pages/learner/learner-dashboard/learner-dashboard.component';

import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { NavbarComponent } from './shared/navbar/navbar.component';

import { authGuard } from './guards/auth.guard';

import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';


export const routes : Routes =[
    {
      path:'',
      redirectTo: '/login',
      pathMatch: 'full'
    },
    {
      path: 'login',
      component: LoginComponent
    },
    {
      path: 'forgot-password',
      component: ForgotPasswordComponent
    },
    {
      path: 'reset-password',
      component: ResetPasswordComponent
    },
    {
      path: 'app-admin-dashboard',
      component: AdminDashboardComponent,
      canActivate: [authGuard]
    },
    {
      path: 'app-superadmin-dashboard',
      component: SuperadminDashboardComponent,
      canActivate: [authGuard]
    },
    {
      path: 'app-instructor-dashboard',
      component: InstructorDashboardComponent,
      canActivate: [authGuard]
    },
    {
      path: 'app-learner-dashboard',
      component: LearnerDashboardComponent,
      canActivate: [authGuard]
    },
    {
      path: 'app-header',
      component: HeaderComponent
    },
    {
      path: 'app-footer',
      component: FooterComponent
    },
    {
      path: 'app-sidebar',
      component: SidebarComponent,
      canActivate: [authGuard]
    },
    {
      path: 'app-navbar',
      component: NavbarComponent
    },
    {
      path: '**',
      redirectTo: '/login'
    }
  ];