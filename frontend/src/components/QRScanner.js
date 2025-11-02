import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import './QRScanner.css';

const API_BASE = "https://milbantkar-1.onrender.com";

function QRScanner() {
    const [scanning, setScanning] = useState(true);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cameraPermission, setCameraPermission] = useState(null);
    const scannerRef = useRef(null);
    const html5QrcodeScannerRef = useRef(null);
    const navigate = useNavigate();

    // Get userId from localStorage
    const getUserId = () => {
        try {
            const raw = localStorage.getItem('userId');
            if (!raw) return null;
            const trimmed = raw.trim();
            // Handle if it's stored as JSON string
            if (trimmed.startsWith('"') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    return typeof parsed === 'string' ? parsed : (parsed._id || parsed.id || parsed.userId || null);
                } catch {
                    return trimmed.replace(/^["']|["']$/g, '');
                }
            }
            return trimmed;
        } catch (err) {
            console.error('Error parsing userId from localStorage:', err);
            return null;
        }
    };

    // Check camera permissions
    useEffect(() => {
        checkCameraPermission();
    }, []);

    const checkCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setCameraPermission('granted');
        } catch (err) {
            console.error('Camera permission denied:', err);
            setCameraPermission('denied');
            setError('Camera access is required to scan QR codes. Please allow camera permissions.');
        }
    };

    // Initialize QR Scanner
    useEffect(() => {
        if (cameraPermission === 'granted' && scanning && !result && !loading && !html5QrcodeScannerRef.current) {
            const elementId = "qr-reader";
            
            const startScanning = async () => {
                try {
                    const html5Qrcode = new Html5Qrcode(elementId);
                    
                    await html5Qrcode.start(
                        {
                            facingMode: "environment"
                        },
                        {
                            fps: 10,
                            qrbox: { width: 300, height: 300 }
                        },
                        (decodedText) => {
                            // Success callback
                            if (decodedText && scanning) {
                                handleScan(decodedText);
                            }
                        },
                        (errorMessage) => {
                            // Error callback - ignore, it's just scanning
                        }
                    );

                    html5QrcodeScannerRef.current = html5Qrcode;
                } catch (err) {
                    console.error('Error initializing QR scanner:', err);
                    if (err.name !== 'NotFoundException') {
                        setError('Failed to initialize camera. Please try again.');
                    }
                }
            };

            startScanning();
        }

        // Cleanup function
        return () => {
            if (html5QrcodeScannerRef.current) {
                html5QrcodeScannerRef.current.stop().catch(err => {
                    console.error('Error stopping scanner:', err);
                }).finally(() => {
                    html5QrcodeScannerRef.current = null;
                });
            }
        };
    }, [cameraPermission, scanning, result, loading]);

    const handleScan = async (content) => {
        if (!content || !scanning) return;
        
        const trimmedContent = content.trim();
        console.log('📱 Scanned QR code:', trimmedContent);
        
        if (!trimmedContent || trimmedContent.toLowerCase() === "undefined") {
            setError("Invalid or empty QR code scanned.");
            setScanning(true);
            return;
        }

        setScanning(false);
        setResult(trimmedContent);
        
        // Stop scanner
        if (html5QrcodeScannerRef.current) {
            try {
                await html5QrcodeScannerRef.current.stop();
                html5QrcodeScannerRef.current = null;
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
        
        await joinEvent(trimmedContent);
    };

    const joinEvent = async (eventCode) => {
        const userId = getUserId();
        console.log('🔍 Joining event with code:', eventCode, 'userId:', userId);
        
        if (!eventCode || !userId) {
            console.error('❌ Missing eventCode or userId:', { eventCode, userId });
            setError('Invalid QR code or user not logged in. Please log in and try again.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('📤 Sending join request:', { eventCode, userId });
            const response = await axios.post(`${API_BASE}/api/events/join/${eventCode}`, {
                userId: userId,
            });
            console.log('✅ Join response:', response.data);

            if (response.data) {
                showNotification('Successfully joined the event!', 'success');
                
                // Redirect to the event page after a short delay
                setTimeout(() => {
                    navigate(`/events/${response.data.event._id || response.data.event.id}`);
                }, 2000);
            }
        } catch (err) {
            console.error('Error joining event:', err);
            const errorMessage = err.response?.data?.message || 'Failed to join event. Please check the QR code and try again.';
            setError(errorMessage);
            setScanning(true); // Restart scanning on error
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type) => {
        // Remove existing notifications first
        const existingNotifications = document.querySelectorAll('.scanner-notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `scanner-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    };

    const restartScanning = async () => {
        // Stop existing scanner
        if (html5QrcodeScannerRef.current) {
            try {
                await html5QrcodeScannerRef.current.stop();
                html5QrcodeScannerRef.current = null;
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
        
        setScanning(true);
        setResult(null);
        setError('');
    };

    const handleManualCode = () => {
        navigate('/events'); // Navigate to events page where they can enter code manually
    };

    return (
        <div className="qr-scanner-container">
            {/* Header */}
            <div className="scanner-header">
                <button 
                    className="btn-back"
                    onClick={() => navigate(-1)}
                >
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1>Scan QR Code</h1>
                <button 
                    className="btn-manual"
                    onClick={handleManualCode}
                >
                    <i className="fas fa-keyboard"></i>
                </button>
            </div>

            {/* Scanner Content */}
            <div className="scanner-content">
                {cameraPermission === 'denied' ? (
                    <div className="camera-permission-denied">
                        <div className="permission-icon">
                            <i className="fas fa-video-slash"></i>
                        </div>
                        <h3>Camera Access Required</h3>
                        <p>Please allow camera permissions to scan QR codes.</p>
                        <button 
                            className="btn-permission"
                            onClick={() => window.location.reload()}
                        >
                            <i className="fas fa-sync"></i>
                            Retry
                        </button>
                    </div>
                ) : error && !loading ? (
                    <div className="scanner-error">
                        <div className="error-icon">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3>Scanning Error</h3>
                        <p>{error}</p>
                        <button 
                            className="btn-retry"
                            onClick={restartScanning}
                        >
                            <i className="fas fa-redo"></i>
                            Try Again
                        </button>
                    </div>
                ) : loading ? (
                    <div className="scanner-loading">
                        <div className="loading-spinner">
                            <div className="spinner-ring"></div>
                        </div>
                        <h3>Joining Event...</h3>
                        <p>Please wait while we add you to the event</p>
                    </div>
                ) : result ? (
                    <div className="scanner-success">
                        <div className="success-icon">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h3>Event Found!</h3>
                        <p>Redirecting to event...</p>
                        <div className="success-code">
                            Code: <strong>{result}</strong>
                        </div>
                    </div>
                ) : (
                    <div className="scanner-active">
                        {/* QR Scanner */}
                        <div className="scanner-wrapper" ref={scannerRef}>
                            <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
                            
                            {/* Scanner Overlay */}
                            <div className="scanner-overlay">
                                <div className="scanner-frame">
                                    <div className="corner top-left"></div>
                                    <div className="corner top-right"></div>
                                    <div className="corner bottom-left"></div>
                                    <div className="corner bottom-right"></div>
                                </div>
                                <div className="scan-line"></div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="scanner-instructions">
                            <p>Point your camera at a Milbantkar event QR code</p>
                            <div className="instruction-tips">
                                <div className="tip">
                                    <i className="fas fa-lightbulb"></i>
                                    Ensure good lighting
                                </div>
                                <div className="tip">
                                    <i className="fas fa-hand-steady"></i>
                                    Hold steady
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            {!loading && !result && cameraPermission !== 'denied' && (
                <div className="scanner-footer">
                    <button 
                        className="btn-flashlight"
                        onClick={() => {
                            // Flashlight toggle would go here
                            showNotification('Flashlight feature coming soon!', 'info');
                        }}
                    >
                        <i className="fas fa-lightbulb"></i>
                        Flashlight
                    </button>
                    
                    <button 
                        className="btn-gallery"
                        onClick={() => {
                            // Image upload feature would go here
                            showNotification('Image upload feature coming soon!', 'info');
                        }}
                    >
                        <i className="fas fa-image"></i>
                        Upload Image
                    </button>
                </div>
            )}
        </div>
    );
}

export default QRScanner;