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
    const isMountedRef = useRef(true);
    const isStartingRef = useRef(false);
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

    // Request camera permission manually
    const requestCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setCameraPermission('granted');
            setError('');
            // Reset scanning state to trigger scanner initialization
            setScanning(false);
            setTimeout(() => {
                setScanning(true);
            }, 100);
        } catch (err) {
            console.error('Camera permission denied:', err);
            setCameraPermission('denied');
            if (err.name === 'NotAllowedError') {
                setError('Camera access denied. Please enable camera permissions in your browser settings and refresh.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera found on this device.');
            } else {
                setError('Failed to access camera. Please check your browser settings.');
            }
        }
    };

    // Cleanup on unmount and add global error handler
    useEffect(() => {
        isMountedRef.current = true;
        
        // Handle unhandled promise rejections for play() interruption errors
        const handleUnhandledRejection = (event) => {
            const error = event.reason;
            if (
                error?.name === 'AbortError' ||
                error?.message?.includes('play()') ||
                error?.message?.includes('interrupted') ||
                error?.message?.includes('media was removed')
            ) {
                // Suppress these harmless cleanup errors
                event.preventDefault();
                return;
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            isMountedRef.current = false;
            isStartingRef.current = false;
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            
            // Clean up scanner on unmount
            if (html5QrcodeScannerRef.current) {
                html5QrcodeScannerRef.current.stop().catch((err) => {
                    // Suppress AbortError and play() interruption errors
                    if (
                        err.name !== 'AbortError' &&
                        !err.message?.includes('play()') &&
                        !err.message?.includes('interrupted') &&
                        !err.message?.includes('media was removed')
                    ) {
                        console.error('Unmount cleanup error:', err);
                    }
                }).finally(() => {
                    html5QrcodeScannerRef.current = null;
                });
            }
        };
    }, []);

    // Initialize QR Scanner - try to start directly
    useEffect(() => {
        if (scanning && !result && !loading && !html5QrcodeScannerRef.current && cameraPermission !== 'denied' && !isStartingRef.current) {
            const elementId = "qr-reader";
            
            const startScanning = async () => {
                // Check if element exists
                const element = document.getElementById(elementId);
                if (!element || !isMountedRef.current) {
                    return;
                }

                isStartingRef.current = true;
                
                try {
                    const html5Qrcode = new Html5Qrcode(elementId);
                    
                    // Calculate responsive QR box size
                    const qrboxSize = Math.min(300, window.innerWidth * 0.8);
                    
                    await html5Qrcode.start(
                        {
                            facingMode: "environment"
                        },
                        {
                            fps: 10,
                            qrbox: { width: qrboxSize, height: qrboxSize }
                        },
                        (decodedText) => {
                            // Success callback - check if still mounted
                            if (decodedText && scanning && isMountedRef.current) {
                                handleScan(decodedText);
                            }
                        },
                        (errorMessage) => {
                            // Error callback - ignore scanning errors
                            // Suppress play() interruption errors
                            if (errorMessage && !errorMessage.includes('play()') && !errorMessage.includes('interrupted')) {
                                // Only log non-play errors
                            }
                        }
                    );

                    // Only set ref if still mounted
                    if (isMountedRef.current) {
                        html5QrcodeScannerRef.current = html5Qrcode;
                        setCameraPermission('granted');
                        setError('');
                    } else {
                        // Clean up if unmounted during start
                        html5Qrcode.stop().catch(() => {});
                    }
                } catch (err) {
                    // Suppress play() interruption errors and AbortError
                    if (
                        err.name === 'AbortError' ||
                        err.message?.includes('play()') || 
                        err.message?.includes('interrupted') ||
                        err.message?.includes('media was removed')
                    ) {
                        // This is a harmless cleanup race condition
                        isStartingRef.current = false;
                        return;
                    }
                    
                    if (!isMountedRef.current) {
                        isStartingRef.current = false;
                        return;
                    }
                    
                    console.error('Error initializing QR scanner:', err);
                    html5QrcodeScannerRef.current = null;
                    
                    if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
                        setCameraPermission('denied');
                        setError('Camera access denied. Please allow camera permissions to scan QR codes.');
                    } else if (err.name === 'NotFoundError' || err.message?.includes('No camera')) {
                        setCameraPermission('denied');
                        setError('No camera found on this device.');
                    } else {
                        // Don't set permission to denied for other errors - might be temporary
                        setError('Failed to start camera. Click "Allow Camera" to try again.');
                        setCameraPermission(null);
                    }
                } finally {
                    isStartingRef.current = false;
                }
            };

            // Small delay to ensure DOM is ready
            const timeoutId = setTimeout(() => {
                if (isMountedRef.current) {
                    startScanning();
                }
            }, 100);

            return () => {
                clearTimeout(timeoutId);
                isStartingRef.current = false;
                if (html5QrcodeScannerRef.current) {
                    const scanner = html5QrcodeScannerRef.current;
                    html5QrcodeScannerRef.current = null;
                    scanner.stop().catch((err) => {
                        // Suppress AbortError and play() interruption errors
                        if (
                            err.name !== 'AbortError' &&
                            !err.message?.includes('play()') &&
                            !err.message?.includes('interrupted') &&
                            !err.message?.includes('media was removed')
                        ) {
                            console.error('Cleanup error:', err);
                        }
                    });
                }
            };
        }

        // Cleanup when conditions change
        return () => {
            if (html5QrcodeScannerRef.current && (!scanning || result || loading)) {
                const scanner = html5QrcodeScannerRef.current;
                html5QrcodeScannerRef.current = null;
                scanner.stop().catch((err) => {
                    // Suppress AbortError and play() interruption errors
                    if (
                        err.name !== 'AbortError' &&
                        !err.message?.includes('play()') &&
                        !err.message?.includes('interrupted') &&
                        !err.message?.includes('media was removed')
                    ) {
                        console.error('Cleanup error:', err);
                    }
                });
            }
        };
    }, [scanning, result, loading, cameraPermission]);

    const handleScan = async (content) => {
        if (!content || !scanning || !isMountedRef.current) return;
        
        const trimmedContent = content.trim();
        console.log('📱 Scanned QR code:', trimmedContent);
        
        if (!trimmedContent || trimmedContent.toLowerCase() === "undefined") {
            setError("Invalid or empty QR code scanned.");
            setScanning(true);
            return;
        }

        setScanning(false);
        setResult(trimmedContent);
        
        // Stop scanner safely
        if (html5QrcodeScannerRef.current) {
            try {
                const scanner = html5QrcodeScannerRef.current;
                html5QrcodeScannerRef.current = null;
                await scanner.stop();
            } catch (err) {
                // Suppress play() interruption errors and AbortError during cleanup
                if (
                    err.name !== 'AbortError' &&
                    !err.message?.includes('play()') && 
                    !err.message?.includes('interrupted') &&
                    !err.message?.includes('media was removed')
                ) {
                    console.error('Error stopping scanner:', err);
                }
            }
        }
        
        if (isMountedRef.current) {
            await joinEvent(trimmedContent);
        }
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
        // Stop existing scanner safely
        if (html5QrcodeScannerRef.current) {
            try {
                const scanner = html5QrcodeScannerRef.current;
                html5QrcodeScannerRef.current = null;
                await scanner.stop();
            } catch (err) {
                // Suppress play() interruption errors and AbortError during cleanup
                if (
                    err.name !== 'AbortError' &&
                    !err.message?.includes('play()') && 
                    !err.message?.includes('interrupted') &&
                    !err.message?.includes('media was removed')
                ) {
                    console.error('Error stopping scanner:', err);
                }
            }
        }
        
        // Reset states to allow retry
        setScanning(true);
        setResult(null);
        setError('');
        setCameraPermission(null); // Reset permission state to allow retry
        isStartingRef.current = false;
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
                        <p>{error || 'Please allow camera permissions to scan QR codes.'}</p>
                        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                            <button 
                                className="btn-permission"
                                onClick={requestCameraPermission}
                            >
                                <i className="fas fa-camera"></i>
                                Allow Camera
                            </button>
                            <button 
                                className="btn-permission"
                                onClick={() => window.location.reload()}
                                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                            >
                                <i className="fas fa-sync"></i>
                                Refresh Page
                            </button>
                        </div>
                    </div>
                ) : error && !loading && cameraPermission !== 'granted' ? (
                    <div className="scanner-error">
                        <div className="error-icon">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3>Camera Error</h3>
                        <p>{error}</p>
                        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                            <button 
                                className="btn-retry"
                                onClick={requestCameraPermission}
                            >
                                <i className="fas fa-camera"></i>
                                Allow Camera
                            </button>
                            <button 
                                className="btn-retry"
                                onClick={restartScanning}
                                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                            >
                                <i className="fas fa-redo"></i>
                                Try Again
                            </button>
                        </div>
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