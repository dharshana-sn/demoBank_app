import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    Alert, ActivityIndicator
} from 'react-native';
import { getKycStatus, deleteKycDocument } from '../api/api';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

const DOCUMENT_TYPES = [
    { id: 'passport', label: 'Passport', icon: '📔', desc: 'Upload your valid passport' },
    { id: 'driving_license', label: "Driver's License", icon: '🪪', desc: 'Upload your driver\'s license' },
    { id: 'national_id', label: 'National ID Card', icon: '🆔', desc: 'Upload a government-issued ID' },
    { id: 'utility_bill', label: 'Utility Bill', icon: '📄', desc: 'Proof of address document' },
];

export default function KycScreen({ navigation }) {
    const [kycStatus, setKycStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

    const load = async () => {
        try {
            const data = await getKycStatus();
            setKycStatus(data);
        } catch (err) {
            console.error('KYC status error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

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
                            await deleteKycDocument(docType);
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

    const uploadedDocs = kycStatus?.documents || {};
    const uploadedCount = Object.keys(uploadedDocs).filter(k => uploadedDocs[k]).length;
    const isVerified = kycStatus?.verified;

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.pageTitle}>KYC Verification</Text>
                    <Text style={styles.pageSub}>Upload documents to verify your identity</Text>
                </View>
                <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Overview')}>
                    <Text style={{ fontSize: 20 }}>🏠</Text>
                </TouchableOpacity>
            </View>

            {/* Status Banner */}
            <LinearGradient
                colors={isVerified ? ['#059669', '#10B981'] : [COLORS.gradStart, COLORS.gradEnd]}
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

            {/* Progress Bar */}
            <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Verification Progress</Text>
                    <Text style={styles.progressPct}>{Math.round((uploadedCount / DOCUMENT_TYPES.length) * 100)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${(uploadedCount / DOCUMENT_TYPES.length) * 100}%` }]} />
                </View>
            </View>

            {/* Document List */}
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
                                        style={styles.deleteBtn}
                                        onPress={() => handleDelete(doc.id)}
                                        disabled={deleting === doc.id}
                                    >
                                        {deleting === doc.id
                                            ? <ActivityIndicator size="small" color={COLORS.danger} />
                                            : <Text style={styles.deleteBtnText}>🗑️</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.uploadBtn}
                                    onPress={() => Alert.alert('Upload', 'File upload requires camera/gallery access. Feature available on physical device.')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.uploadBtnText}>Upload</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Info box */}
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: { 
        paddingHorizontal: SPACING.md, 
        paddingTop: 20, 
        paddingBottom: 12, 
        backgroundColor: COLORS.card, 
        borderBottomWidth: 1, 
        borderBottomColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    homeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    pageTitle: { ...FONTS.bold, fontSize: 22, color: COLORS.text },
    pageSub: { ...FONTS.regular, fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    statusBanner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
    statusTitle: { ...FONTS.bold, fontSize: 18, color: '#fff' },
    statusSub: { ...FONTS.regular, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    progressCard: { backgroundColor: COLORS.card, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    progressLabel: { ...FONTS.medium, fontSize: 13, color: COLORS.text },
    progressPct: { ...FONTS.bold, fontSize: 13, color: COLORS.primary },
    progressTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
    section: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
    sectionTitle: { ...FONTS.semiBold, fontSize: 15, color: COLORS.text, marginBottom: 12 },
    docCard: {
        backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md,
        marginBottom: SPACING.sm, ...SHADOWS.sm,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    docLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    docLabel: { ...FONTS.semiBold, fontSize: 14, color: COLORS.text },
    docDesc: { ...FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
    docActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    uploadedBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
    uploadedText: { ...FONTS.bold, fontSize: 11, color: COLORS.success },
    deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
    deleteBtnText: { fontSize: 16 },
    uploadBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.md },
    uploadBtnText: { ...FONTS.bold, fontSize: 12, color: '#fff' },
    infoBox: { backgroundColor: '#EFF6FF', marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: '#BFDBFE' },
    infoTitle: { ...FONTS.semiBold, fontSize: 13, color: COLORS.primary, marginBottom: 6 },
    infoText: { ...FONTS.regular, fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
});
