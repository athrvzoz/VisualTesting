import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ReportDetailComponent } from './components/report-detail/report-detail.component';
import { BaselineManagerComponent } from './components/baseline-manager/baseline-manager.component';

export const routes: Routes = [
    { path: '', pathMatch: 'full', component: DashboardComponent },
    { path: 'report/:id', component: ReportDetailComponent },
    { path: 'baselines', component: BaselineManagerComponent },
    { path: '**', redirectTo: '/' }
];
