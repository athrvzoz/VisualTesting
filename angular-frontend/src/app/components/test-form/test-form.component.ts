import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LucideAngularModule, Play, Loader2, Plus, Shield, ShieldOff, X } from 'lucide-angular';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-test-form',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './test-form.component.html'
})
export class TestFormComponent implements OnInit, OnDestroy {
    @Output() testComplete = new EventEmitter<any>();

    url = '';
    domain = '';
    availableRoutes: string[] = [];
    selectedRoutes: string[] = ['/'];
    newRoute = '';
    loading = false;
    error: string | null = null;

    // Authentication state
    requiresAuth = false;
    mobile = '';
    password = '';
    customHeaders: any = {};

    private urlSubject = new Subject<string>();
    private urlSubscription?: Subscription;

    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.urlSubscription = this.urlSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(url => {
            this.handleUrlChange(url);
        });
    }

    ngOnDestroy() {
        this.urlSubscription?.unsubscribe();
    }

    onUrlInput() {
        this.urlSubject.next(this.url);
    }

    handleUrlChange(url: string) {
        if (url) {
            try {
                const urlObj = new URL(url);
                const extractedDomain = urlObj.hostname;
                this.domain = extractedDomain;
                this.loadRoutes(extractedDomain);
                this.loadAuthConfig(extractedDomain);
            } catch (e) {
                this.domain = '';
                this.availableRoutes = [];
            }
        } else {
            this.domain = '';
            this.availableRoutes = [];
        }
    }

    loadAuthConfig(domain: string) {
        this.apiService.getAuthConfig(domain).subscribe({
            next: (config) => {
                this.requiresAuth = config.requiresAuth || false;
                this.mobile = config.mobile || '';
                this.password = config.password || '';
                this.customHeaders = config.customHeaders || {};
            },
            error: (err) => console.error('Failed to load auth config:', err)
        });
    }

    loadRoutes(domain: string) {
        this.apiService.getRoutes(domain).subscribe({
            next: (routes) => {
                this.availableRoutes = routes;
                // If / exists in available routes, make sure it's selected by default if nothing else is
                if (routes.includes('/') && this.selectedRoutes.length === 0) {
                    this.selectedRoutes = ['/'];
                }
            },
            error: (err) => console.error('Failed to load routes:', err)
        });
    }

    toggleRoute(route: string) {
        if (this.selectedRoutes.includes(route)) {
            this.selectedRoutes = this.selectedRoutes.filter(r => r !== route);
        } else {
            this.selectedRoutes = [...this.selectedRoutes, route];
        }
    }

    handleAddRoute() {
        if (!this.newRoute.trim() || !this.domain) return;
        const route = this.newRoute.trim();

        this.apiService.saveRoute(this.domain, route).subscribe({
            next: (updatedRoutes) => {
                this.availableRoutes = updatedRoutes;
                this.selectedRoutes = [...this.selectedRoutes, route];
                this.newRoute = '';
            },
            error: (err) => console.error('Failed to save route:', err)
        });
    }

    handleDeleteRoute(routeToDelete: string) {
        if (routeToDelete === '/' && this.availableRoutes.length === 1) {
            alert('Cannot delete the last route');
            return;
        }

        if (!window.confirm(`Delete route "${routeToDelete}"?`)) return;

        this.selectedRoutes = this.selectedRoutes.filter(r => r !== routeToDelete);
        this.availableRoutes = this.availableRoutes.filter(r => r !== routeToDelete);
        // Ideally call API to delete route here if backend supports it
    }

    handleSaveAuth() {
        if (!this.domain) return;
        this.apiService.saveAuthConfig(this.domain, {
            requiresAuth: this.requiresAuth,
            mobile: this.mobile,
            password: this.password,
            customHeaders: this.customHeaders
        }).subscribe({
            error: (err) => console.error('Failed to save auth config:', err)
        });
    }

    toggleAuth() {
        this.requiresAuth = !this.requiresAuth;
        this.handleSaveAuth();
    }

    handleSubmit() {
        if (this.selectedRoutes.length === 0) {
            this.error = 'Please select at least one route';
            return;
        }

        this.loading = true;
        this.error = null;

        const authConfig = {
            requiresAuth: this.requiresAuth,
            mobile: this.mobile,
            password: this.password,
            customHeaders: this.customHeaders
        };

        this.apiService.runTest(this.url, this.selectedRoutes, authConfig).subscribe({
            next: (report) => {
                this.testComplete.emit(report);
                this.url = '';
                this.selectedRoutes = ['/'];
                this.loading = false;
            },
            error: (err) => {
                this.error = err.error?.error || err.message;
                this.loading = false;
            }
        });
    }
}
