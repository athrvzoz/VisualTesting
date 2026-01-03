import React, { useEffect, useState } from 'react';
import { getReports, deleteReport } from '../api';
import { FileText, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReportList() {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const data = await getReports();
            setReports(data);
        } catch (err) {
            console.error('Failed to load reports', err);
        }
    };

    const handleDelete = async (reportId, reportSite) => {
        if (!window.confirm(`Are you sure you want to delete the report for "${reportSite}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteReport(reportId);
            alert('Report deleted successfully');
            loadReports(); // Refresh the list
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete report');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                <FileText /> Recent Reports
            </h2>
            <div className="space-y-4">
                {reports.length === 0 ? (
                    <p className="text-gray-500">No reports found.</p>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="border p-4 rounded-md hover:bg-gray-50 transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg text-blue-600">{report.site}</h3>
                                    <p className="text-gray-600 text-sm mt-1">{report.url}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        to={`/report/${report.id}`}
                                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 text-sm flex items-center gap-1"
                                    >
                                        View <ExternalLink size={14} />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(report.id, report.site)}
                                        className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-sm flex items-center gap-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {new Date(report.timestamp).toLocaleString()}
                                </span>
                                <span>Duration: {report.duration}</span>
                                <span>Routes: {report.results?.length || report.tests?.length || 0}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
