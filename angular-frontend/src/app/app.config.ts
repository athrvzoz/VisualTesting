import { ApplicationConfig, provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { LucideAngularModule, Play, Loader2, Plus, Shield, ShieldOff, X, FileText, Clock, ExternalLink, Trash2, ArrowLeft, CheckCircle, XCircle, Smartphone, Download, Globe, Monitor, Tablet, ChevronLeft, Image, RefreshCw } from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(LucideAngularModule.pick({ Play, Loader2, Plus, Shield, ShieldOff, X, FileText, Clock, ExternalLink, Trash2, ArrowLeft, CheckCircle, XCircle, Smartphone, Download, Globe, Monitor, Tablet, ChevronLeft, Image, RefreshCw }))
  ]
};
