import React, { useState, useEffect, useRef } from 'react';
import { getBaselines, uploadBaseline, deleteBaseline, getScreenshotUrl } from '../api';
import { Upload, Trash2, Globe, Monitor, Smartphone, Tablet, ChevronLeft, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BaselineManager() {
    const [domain, setDomain] = useState('');
    const [baselines, setBaselines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRefs = useRef({});

    // Form state
    const [routeName, setRouteName] = useState('home');
    const [viewport, setViewport] = useState('Desktop');
    const [file, setFile] = useState(null);

    const loadBaselines = async () => {
        if (!domain) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getBaselines(domain);
            setBaselines(data);
        } catch (err) {
            setError('Failed to load baselines');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (domain) {
                let sanitizedDomain = domain;
                try {
                    if (domain.includes('://')) {
                        sanitizedDomain = new URL(domain).hostname;
                        setDomain(sanitizedDomain);
                    }
                } catch (e) { }
                loadBaselines();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [domain]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !domain || !routeName || !viewport) {
            alert('Please fill all fields');
            return;
        }

        setUploading(true);
        try {
            await uploadBaseline(domain, routeName, viewport, file);
            setFile(null);
            // Reset file input
            e.target.reset();
            loadBaselines();
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (filename) => {
        if (!window.confirm('Delete this baseline?')) return;
        try {
            await deleteBaseline(domain, filename);
            loadBaselines();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleReplace = (filename) => {
        // Trigger file input for this specific baseline
        if (fileInputRefs.current[filename]) {
            fileInputRefs.current[filename].click();
        }
    };

    const handleReplaceFile = async (filename, file) => {
        if (!file) return;

        // Extract route name and viewport from filename
        // Format: routeName-viewport-fullpage.png
        const parts = filename.replace('-fullpage.png', '').split('-');
        const viewport = parts[parts.length - 1]; // Last part is viewport
        const routeName = parts.slice(0, -1).join('-'); // Everything before viewport

        setUploading(true);
        try {
            await uploadBaseline(domain, routeName, viewport, file);
            loadBaselines();
        } catch (err) {
            alert('Replace failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <Link to="/" className="flex items-center gap-2 text-gray-600 mb-6 hover:text-blue-600">
                <ChevronLeft size={20} /> Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar: Upload Form */}
                <div className="md:w-1/3">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 sticky top-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Upload className="text-blue-600" /> Upload Baseline
                        </h2>

                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                                <input
                                    type="text"
                                    placeholder="example.com"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                                <input
                                    type="text"
                                    placeholder="home, about, etc."
                                    value={routeName}
                                    onChange={(e) => setRouteName(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Viewport</label>
                                <select
                                    value={viewport}
                                    onChange={(e) => setViewport(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="Desktop">Desktop (1920x1080)</option>
                                    <option value="Tablet">Tablet (768x1024)</option>
                                    <option value="Mobile">Mobile (375x667)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image File</label>
                                <input
                                    type="file"
                                    accept="image/png"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || !domain}
                                className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                            >
                                {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                                {uploading ? 'Uploading...' : 'Save Baseline'}
                            </button>
                        </form>

                        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100 italic text-xs text-amber-800">
                            Note: Uploaded images will be used as the new ground truth for visual comparisons.
                        </div>
                    </div>
                </div>

                {/* Main Content: Baseline List */}
                <div className="md:w-2/3">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 min-h-[500px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <ImageIcon className="text-slate-600" /> Existing Baselines
                            </h2>
                            {domain && (
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-mono">
                                    {domain}
                                </span>
                            )}
                        </div>

                        {!domain ? (
                            <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                                <Globe size={48} className="mb-4 opacity-20" />
                                <p>Enter a domain to manage its baselines</p>
                            </div>
                        ) : loading ? (
                            <div className="flex justify-center items-center h-80">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                            </div>
                        ) : baselines.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                                <ImageIcon size={48} className="mb-4 opacity-20" />
                                <p>No baselines found for this domain</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {baselines.map((bl) => (
                                    <div key={bl.filename} className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="aspect-video bg-slate-100 overflow-hidden">
                                            <img
                                                src={getScreenshotUrl(bl.path)}
                                                alt={bl.filename}
                                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => window.open(getScreenshotUrl(bl.path), '_blank')}
                                            />
                                        </div>
                                        <div className="p-3 bg-white flex justify-between items-center">
                                            <div className="truncate pr-2">
                                                <div className="text-sm font-bold truncate text-slate-800">{bl.filename}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {bl.filename.includes('desktop') ? <Monitor size={12} className="text-slate-400" /> :
                                                        bl.filename.includes('tablet') ? <Tablet size={12} className="text-slate-400" /> :
                                                            <Smartphone size={12} className="text-slate-400" />}
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                        {bl.filename.split('-')[1]}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {/* Hidden file input for replace */}
                                                <input
                                                    ref={el => fileInputRefs.current[bl.filename] = el}
                                                    type="file"
                                                    accept="image/png"
                                                    onChange={(e) => handleReplaceFile(bl.filename, e.target.files[0])}
                                                    className="hidden"
                                                />
                                                <button
                                                    onClick={() => handleReplace(bl.filename)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                    title="Replace baseline"
                                                    disabled={uploading}
                                                >
                                                    <RefreshCw size={16} className={uploading ? 'animate-spin' : ''} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bl.filename)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Delete baseline"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
