import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LucideAngularModule, Upload, Trash2, Globe, Monitor, Smartphone, Tablet, ChevronLeft, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-angular';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-baseline-manager',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
    templateUrl: './baseline-manager.component.html'
})
export class BaselineManagerComponent implements OnInit, OnDestroy {
    domain = '';
    baselines: any[] = [];
    loading = false;
    uploading = false;
    error: string | null = null;

    // Form state
    routeName = 'home';
    viewport = 'Desktop';
    authState = 'logged-out';
    file: File | null = null;

    private domainSubject = new Subject<string>();
    private domainSubscription?: Subscription;

    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.domainSubscription = this.domainSubject.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(domain => {
            this.handleDomainChange(domain);
        });
    }

    ngOnDestroy() {
        this.domainSubscription?.unsubscribe();
    }

    onDomainInput() {
        this.domainSubject.next(this.domain);
    }

    handleDomainChange(domain: string) {
        if (!domain) return;
        let sanitizedDomain = domain;
        try {
            if (domain.includes('://')) {
                sanitizedDomain = new URL(domain).hostname;
                this.domain = sanitizedDomain;
            }
        } catch (e) { }
        this.loadBaselines();
    }

    loadBaselines() {
        if (!this.domain) return;
        this.loading = true;
        this.error = null;
        this.apiService.getBaselines(this.domain).subscribe({
            next: (data) => {
                this.baselines = data;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load baselines';
                console.error(err);
                this.loading = false;
            }
        });
    }

    onFileSelected(event: any) {
        this.file = event.target.files[0];
    }

    handleUpload(form: any) {
        if (!this.file || !this.domain || !this.routeName || !this.viewport) {
            alert('Please fill all fields');
            return;
        }

        this.uploading = true;
        this.apiService.uploadBaseline(this.domain, this.routeName, this.viewport, this.file, this.authState).subscribe({
            next: () => {
                this.file = null;
                form.reset();
                this.routeName = 'home';
                this.viewport = 'Desktop';
                this.uploading = false;
                this.loadBaselines();
            },
            error: (err) => {
                alert('Upload failed: ' + (err.error?.error || err.message));
                this.uploading = false;
            }
        });
    }

    handleDelete(state: string, filename: string) {
        if (!window.confirm(`Delete this ${state} baseline?`)) return;
        this.apiService.deleteBaseline(this.domain, state, filename).subscribe({
            next: () => this.loadBaselines(),
            error: (err) => alert('Delete failed')
        });
    }

    triggerReplace(filename: string) {
        const input = document.getElementById('replace-' + filename) as HTMLInputElement;
        if (input) input.click();
    }

    handleReplaceFile(filename: string, event: any) {
        const file = event.target.files[0];
        if (!file) return;

        // Extract route name, viewport and state from filename if possible
        // Or better yet, we can find it in our current baselines list
        const existingBaseline = this.baselines.find(b => b.filename === filename);
        const state = existingBaseline ? existingBaseline.state : 'logged-out';

        const parts = filename.replace('-fullpage.png', '').split('-');
        const viewport = parts[parts.length - 1];
        const routeName = parts.slice(0, -1).join('-');

        this.uploading = true;
        this.apiService.uploadBaseline(this.domain, routeName, viewport, file, state).subscribe({
            next: () => {
                this.uploading = false;
                this.loadBaselines();
            },
            error: (err) => {
                alert('Replace failed: ' + (err.error?.error || err.message));
                this.uploading = false;
            }
        });
    }

    getScreenshotUrl(path: string): string {
        return this.apiService.getScreenshotUrl(path);
    }

    openScreenshot(path: string) {
        window.open(this.getScreenshotUrl(path), '_blank');
    }

    getViewportIcon(filename: string): string {
        if (filename.toLowerCase().includes('desktop')) return 'monitor';
        if (filename.toLowerCase().includes('tablet')) return 'tablet';
        return 'smartphone';
    }
}
