import React, { useState, useEffect } from 'react';
import { runTest, getRoutes, saveRoute, getAuthConfig, saveAuthConfig } from '../api';
import { Play, Loader2, Plus, Shield, ShieldOff, X } from 'lucide-react';

export default function TestForm({ onTestComplete }) {
    const [url, setUrl] = useState('');
    const [domain, setDomain] = useState('');
    const [availableRoutes, setAvailableRoutes] = useState([]);
    const [selectedRoutes, setSelectedRoutes] = useState(['/']);
    const [newRoute, setNewRoute] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Authentication state
    const [requiresAuth, setRequiresAuth] = useState(false);
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [customHeaders, setCustomHeaders] = useState({});

    // Extract domain from URL and load auth config
    useEffect(() => {
        if (url) {
            try {
                const urlObj = new URL(url);
                const extractedDomain = urlObj.hostname;
                setDomain(extractedDomain);
                loadRoutes(extractedDomain);
                loadAuthConfig(extractedDomain);
            } catch (e) {
                setDomain('');
                setAvailableRoutes([]);
            }
        } else {
            setDomain('');
            setAvailableRoutes([]);
        }
    }, [url]);

    const loadAuthConfig = async (domain) => {
        try {
            const config = await getAuthConfig(domain);
            setRequiresAuth(config.requiresAuth || false);
            setMobile(config.mobile || '');
            setPassword(config.password || '');
            setCustomHeaders(config.customHeaders || {});
        } catch (err) {
            console.error('Failed to load auth config:', err);
        }
    };

    const loadRoutes = async (domain) => {
        try {
            const routes = await getRoutes(domain);
            setAvailableRoutes(routes);
            // Auto-select home route
            if (routes.includes('/') && !selectedRoutes.includes('/')) {
                setSelectedRoutes(['/']);
            }
        } catch (err) {
            console.error('Failed to load routes:', err);
        }
    };

    const toggleRoute = (route) => {
        if (selectedRoutes.includes(route)) {
            setSelectedRoutes(selectedRoutes.filter(r => r !== route));
        } else {
            setSelectedRoutes([...selectedRoutes, route]);
        }
    };

    const handleAddRoute = async () => {
        if (!newRoute.trim() || !domain) return;

        const route = newRoute.trim();

        try {
            const updatedRoutes = await saveRoute(domain, route);
            setAvailableRoutes(updatedRoutes);
            setSelectedRoutes([...selectedRoutes, route]);
            setNewRoute('');
        } catch (err) {
            console.error('Failed to save route:', err);
        }
    };

    const handleDeleteRoute = async (routeToDelete) => {
        if (routeToDelete === '/' && availableRoutes.length === 1) {
            alert('Cannot delete the last route');
            return;
        }

        if (!window.confirm(`Delete route "${routeToDelete}"?`)) return;

        try {
            // Remove from selected routes
            setSelectedRoutes(selectedRoutes.filter(r => r !== routeToDelete));
            // Remove from available routes
            const updatedRoutes = availableRoutes.filter(r => r !== routeToDelete);
            setAvailableRoutes(updatedRoutes);

            // Note: You may want to add a backend endpoint to persist this deletion
            // For now, it will be removed from the UI but will reappear on page reload
        } catch (err) {
            console.error('Failed to delete route:', err);
        }
    };

    const handleSaveAuth = async () => {
        if (!domain) return;
        try {
            await saveAuthConfig(domain, {
                requiresAuth,
                mobile,
                password,
                customHeaders
            });
        } catch (err) {
            console.error('Failed to save auth config:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedRoutes.length === 0) {
            setError('Please select at least one route');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const authConfig = {
                requiresAuth,
                mobile,
                password,
                customHeaders
            };
            const report = await runTest(url, selectedRoutes, authConfig);
            onTestComplete(report);
            setUrl('');
            setSelectedRoutes(['/']);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Run Visual Test</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                    <input
                        type="url"
                        required
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {domain && (
                    <>
                        {/* Authentication Section */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    {requiresAuth ? <Shield className="text-green-600" size={20} /> : <ShieldOff className="text-gray-400" size={20} />}
                                    Authentication
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setRequiresAuth(!requiresAuth)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${requiresAuth ? 'bg-green-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${requiresAuth ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {requiresAuth && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number</label>
                                        <input
                                            type="tel"
                                            placeholder="Enter mobile number"
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value)}
                                            onBlur={handleSaveAuth}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                                        <input
                                            type="password"
                                            placeholder="Enter password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onBlur={handleSaveAuth}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 italic bg-blue-50 p-2 rounded">
                                        ℹ️ System will auto-login and capture session for testing
                                    </p>
                                </div>
                            )}

                            {!requiresAuth && (
                                <p className="text-xs text-gray-500 italic">
                                    Toggle ON to test authenticated pages (e.g., my-bets, profile)
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Routes to Test
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {availableRoutes.map((route) => (
                                    <div key={route} className="relative group">
                                        <button
                                            type="button"
                                            onClick={() => toggleRoute(route)}
                                            className={`px-4 py-2 pr-8 rounded-md font-medium transition ${selectedRoutes.includes(route)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {route}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteRoute(route);
                                            }}
                                            className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full transition-opacity ${selectedRoutes.includes(route)
                                                    ? 'text-white hover:bg-blue-700'
                                                    : 'text-gray-500 hover:bg-gray-300'
                                                }`}
                                            title="Delete route"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add custom route (e.g., /about)"
                                    value={newRoute}
                                    onChange={(e) => setNewRoute(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRoute())}
                                    className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddRoute}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-1 text-sm"
                                >
                                    <Plus size={16} />
                                    Add Route
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-md">
                            <p className="text-sm text-gray-700">
                                <strong>Selected routes:</strong> {selectedRoutes.length > 0 ? selectedRoutes.join(', ') : 'None'}
                            </p>
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    disabled={loading || selectedRoutes.length === 0}
                    className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Play size={20} />}
                    {loading ? 'Running Visual Tests...' : 'Run Test'}
                </button>
            </form>
            {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                    Error: {error}
                </div>
            )}
        </div>
    );
}
