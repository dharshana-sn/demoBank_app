import { useState, useEffect } from "react";
import { UploadCloud, CheckCircle, ShieldCheck, Trash2, ExternalLink } from "lucide-react";
import { uploadKycDocument, getKycStatus, deleteKycDocument } from "../api.js";
import "./Dashboard.css"; 

export default function KycPage() {
    
    const [uploadState, setUploadState] = useState({
        aadhar: { file: null, status: 'idle', message: '' },
        pan: { file: null, status: 'idle', message: '' },
        license: { file: null, status: 'idle', message: '' }
    });

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const status = await getKycStatus();
                setUploadState(prev => {
                    const newState = { ...prev };
                    ['aadhar', 'pan', 'license'].forEach(type => {
                        if (status[type]) {
                            newState[type] = { 
                                file: null, 
                                status: 'verified', 
                                message: 'Verified Successfully', 
                                filename: status[type] 
                            };
                        }
                    });
                    return newState;
                });
            } catch (err) {
                console.error("Failed to fetch KYC status", err);
            }
        };
        fetchStatus();
    }, []);

    const handleDelete = async (type) => {
        if (!window.confirm(`Are you sure you want to delete your document?`)) return;
        
        try {
            await deleteKycDocument(type);
            setUploadState(prev => ({
                ...prev,
                [type]: { file: null, status: 'idle', message: '' }
            }));
        } catch (error) {
            alert('Failed to delete document: ' + error.message);
        }
    };

    const handleFileChange = (type, event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadState(prev => ({
                ...prev,
                [type]: { file, status: 'selected', message: '' }
            }));
        }
    };

    const handleUpload = async (type) => {
        const data = uploadState[type];
        if (!data.file) return;

        setUploadState(prev => ({
            ...prev,
            [type]: { ...prev[type], status: 'uploading' }
        }));

        try {
            const res = await uploadKycDocument(type, data.file);
            setUploadState(prev => ({
                ...prev,
                [type]: { ...prev[type], status: 'verified', message: 'Verified Successfully', filename: res.filename }
            }));
        } catch (error) {
            setUploadState(prev => ({
                ...prev,
                [type]: { ...prev[type], status: 'error', message: error.message || 'Upload failed' }
            }));
        }
    };

    const DocumentCard = ({ title, type, description }) => {
        const state = uploadState[type];
        
        return (
            <div className="card fade-in" style={{ marginBottom: '20px' }} data-testid={`kyc-card-${type}`}>
                <div className="card-header">
                    <h2 className="card-title">{title}</h2>
                    {state.status === 'verified' && <span className="badge badge-blue"><CheckCircle size={14} style={{marginRight: 4}}/> Verified</span>}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '16px' }}>
                    {description}
                </p>
                
                {state.status === 'verified' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#D1FAE5', borderRadius: 8, color: '#065F46' }}>
                            <CheckCircle size={24} />
                            <div style={{ flex: 1 }}>
                                <strong>Document Uploaded</strong>
                                <div style={{ fontSize: '0.8rem', marginTop: 2 }}>Your {title} is verified and secured.</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <a href={`/api/kyc/files/${state.filename}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                                <ExternalLink size={16} /> View Document
                            </a>
                            <button onClick={() => handleDelete(type)} className="btn btn-sm" style={{ flex: 1, background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                                <Trash2 size={16} /> Delete & Re-upload
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ padding: '20px', border: '1px dashed var(--gray-300)', borderRadius: '8px', textAlign: 'center', background: 'var(--gray-50)' }}>
                            <UploadCloud size={32} color="var(--blue-500)" style={{ marginBottom: 10 }} />
                            <div>
                                <input 
                                    type="file" 
                                    id={`file-${type}`} 
                                    style={{ display: 'none' }} 
                                    onChange={(e) => handleFileChange(type, e)}
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    data-testid={`kyc-input-${type}`}
                                />
                                <label htmlFor={`file-${type}`} className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                                    {state.file ? state.file.name : "Select Document"}
                                </label>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: state.status === 'error' ? 'var(--danger)' : 'var(--gray-500)' }}>
                                {state.message || "Max file size: 5MB (.jpg, .png, .pdf)"}
                            </span>
                            <button 
                                className="btn btn-primary btn-sm" 
                                onClick={() => handleUpload(type)}
                                disabled={!state.file || state.status === 'uploading'}
                                data-testid={`kyc-upload-btn-${type}`}
                            >
                                {state.status === 'uploading' ? 'Uploading...' : 'Upload & Verify'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const allVerified = Object.values(uploadState).every(s => s.status === 'verified');

    return (
        <div className="page-content fade-in" data-testid="kyc-page">
            <div className="section" style={{ padding: "10px 28px 20px" }}>
                {allVerified && (
                    <div className="fade-in" style={{ padding: 20, background: 'var(--blue-50)', borderLeft: '4px solid var(--blue-600)', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <ShieldCheck size={32} color="var(--blue-600)" />
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', color: 'var(--blue-800)' }}>KYC Completed Successfully</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--blue-700)' }}>Thank you for verifying your identity. Your account limits have been increased.</p>
                        </div>
                    </div>
                )}

                <DocumentCard 
                    title="Aadhar Card" 
                    type="aadhar" 
                    description="Upload a clear image or PDF of your Aadhar card (Front and Back combined)." 
                />
                <DocumentCard 
                    title="PAN Card" 
                    type="pan" 
                    description="Upload a clear image of your Permanent Account Number (PAN) card." 
                />
                <DocumentCard 
                    title="Driver's License" 
                    type="license" 
                    description="Upload your valid state-issued driver's license for secondary identity verification." 
                />
            </div>
        </div>
    );
}
