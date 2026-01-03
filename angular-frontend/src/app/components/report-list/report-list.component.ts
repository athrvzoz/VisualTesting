import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LucideAngularModule, FileText, Clock, ExternalLink, Trash2 } from 'lucide-angular';

@Component({
    selector: 'app-report-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './report-list.component.html'
})
export class ReportListComponent implements OnInit, OnChanges {
    @Input() refreshKey = 0;
    reports: any[] = [];

    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.loadReports();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['refreshKey'] && !changes['refreshKey'].firstChange) {
            this.loadReports();
        }
    }

    loadReports() {
        this.apiService.getReports().subscribe({
            next: (data) => this.reports = data,
            error: (err) => console.error('Failed to load reports', err)
        });
    }

    handleDelete(reportId: string, reportSite: string) {
        if (!window.confirm(`Are you sure you want to delete the report for "${reportSite}"? This action cannot be undone.`)) {
            return;
        }

        this.apiService.deleteReport(reportId).subscribe({
            next: () => {
                alert('Report deleted successfully');
                this.loadReports();
            },
            error: (err) => {
                console.error('Delete failed:', err);
                alert('Failed to delete report');
            }
        });
    }
}
