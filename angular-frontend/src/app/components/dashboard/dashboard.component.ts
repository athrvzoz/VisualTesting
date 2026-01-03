import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestFormComponent } from '../test-form/test-form.component';
import { ReportListComponent } from '../report-list/report-list.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TestFormComponent, ReportListComponent],
  template: `
    <div class="max-w-5xl mx-auto space-y-12 animate-fade-in">
      <header class="text-center space-y-4">
        <!-- <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-wider uppercase">
          🚀 Next-Gen Visual Regression
        </div> -->
        <h5 class="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
          Snap. <span class="gradient-text">Compare.</span> Assure.
        </h5>
        <p class="text-lg text-slate-500 max-w-2xl mx-auto">
          Pixel-perfect visual testing for your web applications. Spot every difference across routes and viewports in seconds.
        </p>
      </header>

      <div class="grid grid-cols-1 gap-12">
        <app-test-form (testComplete)="onTestComplete()"></app-test-form>
        <app-report-list [refreshKey]="refreshKey"></app-report-list>
      </div>
    </div>

  `
})
export class DashboardComponent {
  refreshKey = 0;

  onTestComplete() {
    this.refreshKey++;
  }
}
