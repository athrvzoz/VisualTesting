import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private API_BASE_URL = 'http://localhost:3000/api';
    private STATIC_BASE_URL = 'http://localhost:3000/public';

    constructor(private http: HttpClient) { }

    runTest(url: string, routes: string[], authConfig: any = {}): Observable<any> {
        return this.http.post(`${this.API_BASE_URL}/test`, {
            url,
            routes,
            requiresAuth: authConfig.requiresAuth,
            mobile: authConfig.mobile,
            password: authConfig.password,
            customHeaders: authConfig.customHeaders
        });
    }

    getReports(): Observable<any> {
        return this.http.get(`${this.API_BASE_URL}/reports`);
    }

    getReport(id: string): Observable<any> {
        return this.http.get(`${this.API_BASE_URL}/reports/${id}`);
    }

    downloadReport(id: string): Observable<Blob> {
        return this.http.get(`${this.API_BASE_URL}/reports/${id}/download`, {
            responseType: 'blob'
        });
    }

    deleteReport(id: string): Observable<any> {
        return this.http.delete(`${this.API_BASE_URL}/reports/${id}`);
    }

    getRoutes(domain: string): Observable<any> {
        return this.http.get(`${this.API_BASE_URL}/routes/${domain}`);
    }

    saveRoute(domain: string, route: string): Observable<any> {
        return this.http.post(`${this.API_BASE_URL}/routes/${domain}`, { route });
    }

    getBaselines(domain: string): Observable<any> {
        return this.http.get(`${this.API_BASE_URL}/baselines/${domain}`);
    }

    uploadBaseline(domain: string, routeName: string, viewport: string, file: File, authState: string = 'logged-out'): Observable<any> {
        const formData = new FormData();
        formData.append('domain', domain);
        formData.append('routeName', routeName);
        formData.append('viewport', viewport);
        formData.append('authState', authState);
        formData.append('image', file);

        return this.http.post(`${this.API_BASE_URL}/baselines/upload`, formData);
    }

    deleteBaseline(domain: string, state: string, filename: string): Observable<any> {
        return this.http.delete(`${this.API_BASE_URL}/baselines/${domain}/${state}/${filename}`);
    }

    getAuthConfig(domain: string): Observable<any> {
        return this.http.get(`${this.API_BASE_URL}/auth/${domain}`);
    }

    saveAuthConfig(domain: string, config: any): Observable<any> {
        return this.http.post(`${this.API_BASE_URL}/auth/${domain}`, config);
    }

    deleteAuthConfig(domain: string): Observable<any> {
        return this.http.delete(`${this.API_BASE_URL}/auth/${domain}`);
    }

    getScreenshotUrl(filename: string): string {
        return `${this.STATIC_BASE_URL}/${filename}`;
    }
}
