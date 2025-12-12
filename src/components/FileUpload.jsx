import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';

const FileUpload = ({ onFileUpload }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) processFile(files[0]);
    };

    const handleFileInput = (e) => {
        const files = e.target.files;
        if (files.length > 0) processFile(files[0]);
    };

    const processFile = async (file) => {
        if (!file.name.match(/\.(xlsx|xls)$/)) {
            setError("Please upload a valid Excel file (.xlsx or .xls)");
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            await onFileUpload(file);
        } catch (err) {
            console.error(err);
            setError("Failed to process file. Ensure it follows the template format.");
            setIsLoading(false);
        }
    };

    return (
        <div className="upload-screen">
            <div className="container flex-col flex-center">
                <h1 className="hero-title">
                    SC Workforce Intelligence
                </h1>
                <p className="hero-subtitle">
                    Upload your multi-month payroll file and unlock deep FP&A-grade HR analytics.
                </p>

                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls"
                        onChange={handleFileInput}
                    />

                    {isLoading ? (
                        <div className="flex-center flex-col">
                            <Loader2 className="upload-icon animate-spin text-cyan" size={64} />
                            <p style={{ marginTop: '1rem' }}>Processing Datasets...</p>
                        </div>
                    ) : (
                        <>
                            <div className="icon-glow-container">
                                <div className="icon-glow-bg"></div>
                                <FileSpreadsheet className="upload-icon" strokeWidth={1} />
                            </div>

                            <h3 className="upload-text-main">
                                Drop your Excel file here
                            </h3>
                            <p className="upload-text-sub">
                                or <span className="upload-link">browse to upload</span>
                            </p>
                        </>
                    )}
                </div>

                {!isLoading && (
                    <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6 }}>
                        <Upload size={16} />
                        <span className="text-sm">Supports unlimited sheets (Auto-detection enabled)</span>
                    </div>
                )}

                {error && (
                    <div className="error-banner">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
