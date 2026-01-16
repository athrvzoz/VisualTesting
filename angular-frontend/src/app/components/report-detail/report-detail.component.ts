import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LucideAngularModule, ArrowLeft, CheckCircle, XCircle, Smartphone, Download, Trash2, Loader2, Image as ImageIcon, Monitor, Tablet, ExternalLink, Globe, Shield } from 'lucide-angular';
import { Subscription, of } from 'rxjs';
import { delay, catchError, map, finalize } from 'rxjs/operators';

@Component({
    selector: 'app-report-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './report-detail.component.html'
})
export class ReportDetailComponent implements OnInit, OnDestroy {
    report: any = null;
    loading = true;
    error: string | null = null;
    private routeSub?: Subscription;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private apiService: ApiService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        // Clear state on init
        this.loading = true;
        this.report = null;
        this.error = null;

        // Use observable for params
        this.routeSub = this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadReport(id);
            } else {
                this.loading = false;
                this.cdr.detectChanges();
            }
        });

        // Safety timeout: 15 seconds
        setTimeout(() => {
            if (this.loading) {
                console.warn('Report loading timed out.');
                this.loading = false;
                this.cdr.detectChanges();
            }
        }, 15000);
    }

    ngOnDestroy() {
        this.routeSub?.unsubscribe();
    }

    loadReport(id: string) {
        this.loading = true;
        this.error = null;
        this.report = null;
        this.cdr.detectChanges();

        this.apiService.getReport(id).pipe(
            finalize(() => {
                // Ensure loading is set to false in the next tick
                setTimeout(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                }, 0);
            })
        ).subscribe({
            next: (data) => {
                if (data) {
                    this.report = data;
                } else {
                    this.error = 'Report not found';
                }
            },
            error: (err) => {
                console.error('Failed to load report:', err);
                this.error = 'Failed to retrieve report data';
                this.report = null;
            }
        });
    }

    get results(): any[] {
        const data = this.report?.results || this.report?.tests || [];
        return Array.isArray(data) ? data : [];
    }

    handleDownload() {
        if (!this.report?.id) return;
        this.apiService.downloadReport(this.report.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report-${this.report.id}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            },
            error: (err) => {
                console.error('Download failed:', err);
                alert('Failed to download report');
            }
        });
    }

    handleDelete() {
        if (!this.report?.id || !window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
            return;
        }

        this.apiService.deleteReport(this.report.id).subscribe({
            next: () => {
                alert('Report deleted successfully');
                this.router.navigate(['/']);
            },
            error: (err) => {
                console.error('Delete failed:', err);
                alert('Failed to delete report');
            }
        });
    }

    getScreenshotUrl(filename: string): string {
        return this.apiService.getScreenshotUrl(filename);
    }

    openScreenshot(filename: string) {
        if (filename) {
            window.open(this.getScreenshotUrl(filename), '_blank');
        }
    }

    getTotalViewports(): number {
        return this.results.reduce((acc: number, r: any) => acc + (r?.viewports?.length || 0), 0) || 0;
    }

    getTotalScreenshots(): number {
        return this.results.reduce((acc: number, r: any) => {
            const viewports = r?.viewports || [];
            return acc + viewports.reduce((sum: number, vp: any) => sum + 1 + (vp?.components?.length || 0), 0);
        }, 0) || 0;
    }

    getTotalComponents(): number {
        return this.results.reduce((acc: number, r: any) => {
            const viewports = r?.viewports || [];
            return acc + viewports.reduce((sum: number, vp: any) => sum + (vp?.components?.length || 0), 0);
        }, 0) || 0;
    }

    getTotalPixelsChanged(): number {
        return this.results.reduce((acc: number, r: any) => {
            const viewports = r?.viewports || [];
            return acc + viewports.reduce((sum: number, vp: any) => {
                let count = (vp?.fullPage?.diffPixels || 0);
                count += (vp?.components || []).reduce((cSum: number, c: any) => cSum + (c?.diffPixels || 0), 0);
                return sum + count;
            }, 0);
        }, 0) || 0;
    }

    getStatusColor(status: string): string {
        if (!status) return 'bg-slate-100 text-slate-500 border-slate-200';
        const s = status.toLowerCase();
        if (s === 'pass') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (s === 'fail') return 'bg-red-100 text-red-700 border-red-200';
        if (s.includes('baseline')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }

    formatStatus(status: string): string {
        if (!status) return 'UNKNOWN';
        try {
            return status.toString().replace(/_/g, ' ').toUpperCase();
        } catch (e) {
            return 'UNKNOWN';
        }
    }
}
