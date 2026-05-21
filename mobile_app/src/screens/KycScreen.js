import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    Alert, ActivityIndicator, Linking
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getKycStatus, deleteKycDocument, uploadKycDocument, BASE_URL } from '../api/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

const DOCUMENT_TYPES = [
    { id: 'aadhar', label: 'Aadhaar Card', icon: '🪪', desc: 'Upload your Aadhaar card' },
    { id: 'pan', label: 'PAN Card', icon: '📔', desc: 'Upload your PAN card' },
    { id: 'license', label: "Driver's License", icon: '🚗', desc: 'Upload your driver\'s license' },
];

export default function KycScreen({ navigation }) {
    const { C } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [kycStatus, setKycStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [uploading, setUploading] = useState(null);

    const styles = getStyles(C, insets);

    const load = async () => {
        if (!user?.id) return;
        try {
            const data = await getKycStatus({ userId: user.id });
            setKycStatus(data);
        } catch (err) {
            console.error('KYC status error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleUpload = async (docType, isReplace = false) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });
            if (result.canceled) return;
            const asset = result.assets[0];
            setUploading(docType);
            await uploadKycDocument(docType, asset.uri, asset.name, asset.mimeType || 'application/octet-stream', user.id);
            await load();
            Alert.alert('Success', isReplace ? 'Document updated successfully!' : 'Document uploaded successfully!');
        } catch (err) {
            Alert.alert('Upload Failed', err.message);
        } finally {
            setUploading(null);
        }
    };

    const handleView = async (docType) => {
        const filename = uploadedDocs[docType];
        if (!filename) return;
        const url = `${BASE_URL}/kyc/files/${filename}`;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Cannot open document viewer.');
            }
        } catch {
            Alert.alert('Error', 'Failed to open document.');
        }
    };

    const handleDelete = (docType) => {
        Alert.alert(
            'Delete Document',
            `Are you sure you want to delete this ${docType} document?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        setDeleting(docType);
                        try {
                            await deleteKycDocument(docType, { userId: user.id });
                            await load();
                        } catch (err) {
                            Alert.alert('Error', err.message);
                        } finally {
                            setDeleting(null);
                        }
                    }
                }
            ]
        );
    };

    const uploadedDocs = kycStatus || {};
    const uploadedCount = Object.values(uploadedDocs).filter(Boolean).length;
    const isVerified = uploadedCount === DOCUMENT_TYPES.length;

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.pageTitle}>KYC Verification</Text>
                    <Text style={styles.pageSub}>Upload documents to verify your identity</Text>
                </View>
                <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.goBack()}>
                    <Text style={{ fontSize: 20 }}>🏠</Text>
                </TouchableOpacity>
            </View>

            <LinearGradient
                colors={isVerified ? ['#059669', '#10B981'] : [C.gradStart, C.gradEnd]}
                style={styles.statusBanner}
            >
                <Text style={{ fontSize: 40 }}>{isVerified ? '✅' : '🔐'}</Text>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.statusTitle}>
                        {isVerified ? 'Identity Verified' : 'Verification Pending'}
                    </Text>
                    <Text style={styles.statusSub}>
                        {uploadedCount} of {DOCUMENT_TYPES.length} documents uploaded
                    </Text>
                </View>
            </LinearGradient>

            <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Verification Progress</Text>
                    <Text style={styles.progressPct}>{Math.round((uploadedCount / DOCUMENT_TYPES.length) * 100)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${(uploadedCount / DOCUMENT_TYPES.length) * 100}%` }]} />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Required Documents</Text>
                {DOCUMENT_TYPES.map(doc => {
                    const isUploaded = !!uploadedDocs[doc.id];
                    return (
                        <View key={doc.id} style={styles.docCard}>
                            <View style={styles.docLeft}>
                                <Text style={{ fontSize: 28, marginRight: 12 }}>{doc.icon}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.docLabel}>{doc.label}</Text>
                                    <Text style={styles.docDesc}>{doc.desc}</Text>
                                </View>
                            </View>
                            {isUploaded ? (
                                <View style={styles.docActions}>
                                    <View style={styles.uploadedBadge}>
                                        <Text style={styles.uploadedText}>✓ Uploaded</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.viewBtn}
                                        onPress={() => handleView(doc.id)}
                                        disabled={uploading === doc.id || deleting === doc.id}
                                    >
                                        <Text style={styles.actionBtnText}>👁️</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.changeBtn}
                                        onPress={() => handleUpload(doc.id, true)}
                                        disabled={uploading === doc.id || deleting === doc.id}
                                    >
                                        {uploading === doc.id
                                            ? <ActivityIndicator size="small" color={C.primary} />
                                            : <Text style={styles.actionBtnText}>✏️</Text>
                                        }
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => handleDelete(doc.id)}
                                        disabled={deleting === doc.id || uploading === doc.id}
                                    >
                                        {deleting === doc.id
                                            ? <ActivityIndicator size="small" color={C.danger} />
                                            : <Text style={styles.actionBtnText}>🗑️</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.uploadBtn}
                                    onPress={() => handleUpload(doc.id)}
                                    disabled={uploading === doc.id}
                                    activeOpacity={0.8}
                                >
                                    {uploading === doc.id
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <Text style={styles.uploadBtnText}>Upload</Text>
                                    }
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                })}
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>🔒 Your documents are encrypted</Text>
                <Text style={styles.infoText}>
                    All uploaded documents are stored securely with AES-256 encryption. Your data is never shared without your consent.
                </Text>
            </View>

            <View style={{ height: 24 }} />
        </ScrollView>
    );
}

function getStyles(C, insets) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: C.bg },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
        topBar: {
            paddingHorizontal: SPACING.md, 
            paddingTop: insets.top > 0 ? insets.top + 8 : 24, 
            paddingBottom: 12,
            backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
        },
        homeBtn: {
            width: 40, height: 40, borderRadius: 20, backgroundColor: C.bg,
            justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border,
        },
        pageTitle: { ...FONTS.bold, fontSize: 22, color: C.text },
        pageSub: { ...FONTS.regular, fontSize: 13, color: C.textMuted, marginTop: 2 },
        statusBanner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
        statusTitle: { ...FONTS.bold, fontSize: 18, color: '#fff' },
        statusSub: { ...FONTS.regular, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
        progressCard: { backgroundColor: C.card, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
        progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
        progressLabel: { ...FONTS.medium, fontSize: 13, color: C.text },
        progressPct: { ...FONTS.bold, fontSize: 13, color: C.primary },
        progressTrack: { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' },
        progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 4 },
        section: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
        sectionTitle: { ...FONTS.semiBold, fontSize: 15, color: C.text, marginBottom: 12 },
        docCard: {
            backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SPACING.md,
            marginBottom: SPACING.sm, ...SHADOWS.sm,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        },
        docLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
        docLabel: { ...FONTS.semiBold, fontSize: 14, color: C.text },
        docDesc: { ...FONTS.regular, fontSize: 11, color: C.textMuted, marginTop: 2 },
        docActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        uploadedBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
        uploadedText: { ...FONTS.bold, fontSize: 11, color: C.success },
        viewBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
        changeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
        deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
        actionBtnText: { fontSize: 16 },
        uploadBtn: { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md },
        uploadBtnText: { ...FONTS.bold, fontSize: 12, color: '#fff' },
        infoBox: { backgroundColor: C.card, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border },
        infoTitle: { ...FONTS.semiBold, fontSize: 13, color: C.primary, marginBottom: 6 },
        infoText: { ...FONTS.regular, fontSize: 12, color: C.textMuted, lineHeight: 18 },
    });
}
