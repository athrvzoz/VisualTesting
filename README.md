# Visual Testing Tool

**Pixel-Perfect UI Regression Detection Across Multiple Resolutions**

A full-stack automated visual testing application that captures and compares website screenshots to detect even single-pixel differences. Tests are performed across Desktop, Tablet, and Mobile resolutions with support for authenticated routes.

## 🎯 Key Features

- **Multi-Resolution Testing**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- **Pixel-Perfect Comparison**: Detects 1-pixel differences using OpenCV
- **Baseline Manager**: Add, delete, and replace baseline images
- **Authentication Support**: Automatic login for testing protected routes
- **Dual Frontend Support**: Choose between **React** or **Angular** frontends
- **Component-Level Testing**: Intelligent detection and testing of UI components
- **Comprehensive Reports**: Visual diff images with accuracy percentages
- **Downloadable Reports**: ZIP archives with all screenshots and results

## 📚 Documentation

- **[Complete Documentation](./DOCUMENTATION.md)** - Comprehensive guide with architecture diagrams, flow diagrams, API documentation, and feature descriptions
- **[Presentation](./Visual_Testing_Tool_Presentation.html)** - Interactive HTML presentation (7 slides)
- **[Word Doc](./Visual_Testing_Tool_Documentation.docx)** - Downloadable Word version of the documentation

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Python 3.x
- pip (Python package manager)

### Installation & Run

#### 1. Backend
```bash
cd backend
npm install
node server.js
```
*Server runs on: http://localhost:3000*

#### 2. Frontend (Option A: React)
```bash
cd frontend
npm install
npm run dev
```
*App runs on: http://localhost:5173*

#### 3. Frontend (Option B: Angular)
```bash
cd angular-frontend
npm install
npm start
```
*App runs on: http://localhost:4200*

## 🧪 Running Your First Test

1. Open either the React (http://localhost:5173) or Angular (http://localhost:4200) frontend
2. Enter a URL (e.g., `https://google.com`)
3. Select routes to test
4. Configure authentication if testing protected routes
5. Click **"Run Test"**
6. View detailed results with diff images

## 🏗️ Architecture

```
visual-testing-app/
├── backend/              # Node.js + Express API
├── frontend/             # React + Vite UI
├── angular-frontend/     # Angular + Vite UI
├── DOCUMENTATION.md      # Complete documentation
└── Visual_Testing_Tool_Documentation.docx # Word doc
```

## 📊 Tech Stack

**Backend**: Node.js, Express, Playwright, Python (OpenCV)  
**Frontend 1**: React, Vite, TailwindCSS, Axios  
**Frontend 2**: Angular, Vite, TailwindCSS, Lucide  
**Storage**: File System (JSON, PNG)

---

**Version**: 2.1  
**Last Updated**: January 3, 2026
