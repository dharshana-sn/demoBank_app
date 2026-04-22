/**
 * PayQRCode.jsx
 *
 * Generates a QR code that links to this DemoBank web app.
 * Anyone who scans it gets taken straight to the app to make a payment.
 */

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Download, RefreshCw } from "lucide-react";
import "./PayQRCode.css";

export default function PayQRCode() {
    const canvasRef = useRef(null);
    const [appUrl, setAppUrl] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const url = window.location.origin + '/pay.html';
        setAppUrl(url);
    }, []);

    useEffect(() => {
        if (!appUrl || !canvasRef.current) return;
        QRCode.toCanvas(canvasRef.current, appUrl, {
            width: 180,
            margin: 2,
            color: {
                dark: "#1e3a5f",
                light: "#ffffff",
            },
            errorCorrectionLevel: "H",
        });
    }, [appUrl, isExpanded]);

    const handleDownload = () => {
        QRCode.toDataURL(appUrl, {
            width: 512,
            margin: 3,
            color: { dark: "#1e3a5f", light: "#ffffff" },
            errorCorrectionLevel: "H",
        }).then((url) => {
            const link = document.createElement("a");
            link.href = url;
            link.download = "demobank-payment-qr.png";
            link.click();
        });
    };

    return (
        <div className="pqr-wrapper" data-testid="pay-qr-section">
            {/* Toggle button */}
            <button
                className="pqr-toggle"
                onClick={() => setIsExpanded((p) => !p)}
                data-testid="btn-toggle-qr"
            >
                <QrCode size={16} />
                <span>{isExpanded ? "Hide Payment QR" : "Show Payment QR"}</span>
                <span className="pqr-badge">Scan to Pay</span>
            </button>

            {/* Collapsible QR panel */}
            {isExpanded && (
                <div className="pqr-panel fade-in" data-testid="pay-qr-panel">
                    <p className="pqr-hint">
                        Scan this QR code to open DemoBank and make a payment directly.
                    </p>

                    <div className="pqr-canvas-wrap">
                        {/* Corner decorators */}
                        <span className="pqr-corner pqr-tl" />
                        <span className="pqr-corner pqr-tr" />
                        <span className="pqr-corner pqr-bl" />
                        <span className="pqr-corner pqr-br" />
                        <canvas ref={canvasRef} className="pqr-canvas" />
                    </div>

                    <p className="pqr-url" title={appUrl}>{appUrl}</p>

                    <div className="pqr-actions">
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={handleDownload}
                            data-testid="btn-download-qr"
                        >
                            <Download size={13} /> Download QR
                        </button>
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setIsExpanded(false)}
                            data-testid="btn-close-qr"
                        >
                            <RefreshCw size={13} /> Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
