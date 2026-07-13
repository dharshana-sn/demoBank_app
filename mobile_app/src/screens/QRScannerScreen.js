import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Alert, Vibration, Animated, Dimensions
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, FONTS, RADIUS } from '../theme/theme';

const { width } = Dimensions.get('window');
const SCAN_BOX = width * 0.68;

export default function QRScannerScreen({ navigation, route }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const pulseAnim = useRef(new Animated.Value(0)).current;

    // Animate the scan line
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    const scanLineY = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, SCAN_BOX - 4],
    });

    const handleBarCodeScanned = ({ type, data }) => {
        if (scanned) return;
        setScanned(true);
        Vibration.vibrate(100);
        try {
            // Expected format: testbank://pay?recipient=CUST002&amount=50&note=Rent
            let recipient = '';
            let amount = '';
            let note = '';


            if (data.startsWith('testbank://pay')) {
                const url = new URL(data);
                recipient = url.searchParams.get('recipient') || '';
                amount = url.searchParams.get('amount') || '';
                note = url.searchParams.get('note') || '';
            } else {
                // Treat raw text as recipient ID
                recipient = data.trim();
            }

            // Navigate to Dashboard > Transfers tab passing scanned data
            navigation.navigate('Dashboard', {
                screen: 'Transfers',
                params: {
                    scannedRecipient: recipient,
                    scannedAmount: amount,
                    scannedNote: note,
                },
            });
        } catch {
            Alert.alert(
                '❌ Invalid QR Code',
                'This QR code is not supported. Please scan a valid Test Bank payment QR code.',
                [{ text: 'Retry', onPress: () => setScanned(false) }]
            );
        }
    };

    if (!permission) {
        return (
            <View style={styles.center}>
                <Text style={styles.infoText}>Checking camera permission…</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
                <Text style={styles.permTitle}>Camera Access Needed</Text>
                <Text style={styles.permSub}>
                    Allow camera access to scan QR codes and make quick payments.
                </Text>
                <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                    <Text style={styles.permBtnText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
                    <Text style={{ ...FONTS.medium, color: COLORS.textMuted, fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={{ fontSize: 20 }}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Scan QR to Pay</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Camera */}
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            {/* Dark overlay with cut-out */}
            <View style={styles.overlay}>
                {/* Top dark area */}
                <View style={styles.overlaySection} />

                {/* Middle row: dark | scan box | dark */}
                <View style={{ flexDirection: 'row' }}>
                    <View style={styles.overlaySide} />
                    {/* Scan box */}
                    <View style={styles.scanBox}>
                        {/* Corner markers */}
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />
                        {/* Animated scan line */}
                        <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
                    </View>
                    <View style={styles.overlaySide} />
                </View>

                {/* Bottom dark area */}
                <View style={styles.overlaySection} />
            </View>

            {/* Instructions */}
            <View style={styles.instructionWrap}>
                <Text style={styles.instructionTitle}>Position the QR code inside the frame</Text>
                <Text style={styles.instructionSub}>Scanning happens automatically</Text>
                {scanned && (
                    <TouchableOpacity style={styles.retryBtn} onPress={() => setScanned(false)}>
                        <Text style={styles.retryText}>🔄 Tap to Scan Again</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const OVERLAY_COLOR = 'rgba(0,0,0,0.65)';
const CORNER_SIZE = 22;
const CORNER_BORDER = 3;
const CORNER_COLOR = COLORS.primary || '#054279';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, backgroundColor: COLORS.bg || '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 32 },
    infoText: { ...FONTS.medium, fontSize: 14, color: COLORS.textMuted },
    permTitle: { ...FONTS.bold, fontSize: 20, color: COLORS.text, textAlign: 'center', marginBottom: 8 },
    permSub: { ...FONTS.regular, fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 28 },
    permBtn: {
        backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14,
        borderRadius: RADIUS.md,
    },
    permBtnText: { ...FONTS.bold, color: '#fff', fontSize: 15 },

    // Header
    header: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { ...FONTS.bold, fontSize: 18, color: '#fff' },

    // Overlay
    overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
    overlaySection: { flex: 1, backgroundColor: OVERLAY_COLOR, width: '100%' },
    overlaySide: { flex: 1, backgroundColor: OVERLAY_COLOR },

    // Scan box
    scanBox: {
        width: SCAN_BOX,
        height: SCAN_BOX,
        backgroundColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
    },
    corner: {
        position: 'absolute',
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        borderColor: CORNER_COLOR,
    },
    cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_BORDER, borderLeftWidth: CORNER_BORDER, borderTopLeftRadius: 4 },
    cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_BORDER, borderRightWidth: CORNER_BORDER, borderTopRightRadius: 4 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_BORDER, borderLeftWidth: CORNER_BORDER, borderBottomLeftRadius: 4 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_BORDER, borderRightWidth: CORNER_BORDER, borderBottomRightRadius: 4 },
    scanLine: {
        position: 'absolute',
        left: 8,
        right: 8,
        height: 2,
        backgroundColor: CORNER_COLOR,
        borderRadius: 2,
        opacity: 0.85,
    },

    // Bottom instructions
    instructionWrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 28,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
    },
    instructionTitle: { ...FONTS.semiBold, fontSize: 15, color: '#fff', textAlign: 'center' },
    instructionSub: { ...FONTS.regular, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
    retryBtn: {
        marginTop: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 24, paddingVertical: 10,
        borderRadius: RADIUS.full || 999,
    },
    retryText: { ...FONTS.semiBold, color: '#fff', fontSize: 14 },
});
