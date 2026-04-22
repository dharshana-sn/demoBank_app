import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TextInput,
    TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { getFixedDeposits, createFixedDeposit } from '../api/api';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

const TENURE_OPTIONS = [
    { label: '3 Months', value: 3, rate: 4.5 },
    { label: '6 Months', value: 6, rate: 5.75 },
    { label: '12 Months', value: 12, rate: 6.85 },
    { label: '24 Months', value: 24, rate: 7.5 },
    { label: '36 Months', value: 36, rate: 7.9 },
];

export default function FixedDepositsScreen({ navigation }) {
    const { C } = useTheme();
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ amount: '', tenure: 12 });

    const styles = getStyles(C);
    const selectedTenure = TENURE_OPTIONS.find(t => t.value === form.tenure) || TENURE_OPTIONS[2];

    useEffect(() => {
        getFixedDeposits()
            .then(setDeposits)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const maturityAmount = () => {
        const p = parseFloat(form.amount) || 0;
        const r = selectedTenure.rate / 100;
        const t = selectedTenure.value / 12;
        return (p + p * r * t).toFixed(2);
    };

    const interestEarned = () => {
        const p = parseFloat(form.amount) || 0;
        return (parseFloat(maturityAmount()) - p).toFixed(2);
    };

    const handleCreate = async () => {
        if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) < 500) {
            Alert.alert('Error', 'Minimum deposit amount is $500.');
            return;
        }
        setSubmitting(true);
        try {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + form.tenure);
            const newFD = {
                principal: parseFloat(form.amount),
                rate: selectedTenure.rate,
                tenure: String(form.tenure),
                startDate: startDate.toISOString().split('T')[0],
                maturityDate: endDate.toISOString().split('T')[0],
                maturityAmount: parseFloat(maturityAmount()),
                status: 'active',
            };
            const saved = await createFixedDeposit(newFD);
            setDeposits(prev => [saved, ...prev]);
            setForm({ amount: '', tenure: 12 });
            setShowForm(false);
            Alert.alert('✅ Success', `Fixed Deposit of $${newFD.principal} created!`);
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const totalFDValue = deposits.reduce((s, d) => s + (d.principal || 0), 0);

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.pageTitle}>Fixed Deposits</Text>
                    <Text style={styles.pageSub}>Secure your future with high-yield deposits</Text>
                </View>
                <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Overview')}>
                    <Text style={{ fontSize: 20 }}>🏠</Text>
                </TouchableOpacity>
            </View>

            <LinearGradient colors={[C.gradStart, C.gradEnd]} style={styles.banner}>
                <View>
                    <Text style={styles.bannerLabel}>Total FD Value</Text>
                    <Text style={styles.bannerValue}>${totalFDValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                </View>
                <View>
                    <Text style={styles.bannerLabel}>Active FDs</Text>
                    <Text style={styles.bannerValue}>{deposits.filter(d => d.status === 'active').length}</Text>
                </View>
            </LinearGradient>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>🏦 Current Interest Rates</Text>
                {TENURE_OPTIONS.map(opt => (
                    <View key={opt.value} style={styles.rateRow}>
                        <Text style={styles.rateTenure}>{opt.label}</Text>
                        <View style={styles.rateBadge}>
                            <Text style={styles.rateBadgeText}>{opt.rate}% p.a.</Text>
                        </View>
                    </View>
                ))}
            </View>

            <TouchableOpacity style={styles.createBtn} onPress={() => setShowForm(p => !p)} activeOpacity={0.85}>
                <LinearGradient colors={[C.gradStart, C.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnInner}>
                    <Text style={styles.createBtnText}>{showForm ? '✕ Cancel' : '+ Open New Fixed Deposit'}</Text>
                </LinearGradient>
            </TouchableOpacity>

            {showForm && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>New Fixed Deposit</Text>
                    <Text style={styles.fieldLabel}>Amount ($) · Min $500</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 5000"
                        placeholderTextColor={C.textLight}
                        value={form.amount}
                        onChangeText={v => setForm(f => ({ ...f, amount: v }))}
                        keyboardType="numeric"
                    />
                    <Text style={styles.fieldLabel}>Tenure</Text>
                    <View style={styles.tenureGrid}>
                        {TENURE_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[styles.tenureOption, form.tenure === opt.value && styles.tenureSelected]}
                                onPress={() => setForm(f => ({ ...f, tenure: opt.value }))}
                            >
                                <Text style={[styles.tenureText, form.tenure === opt.value && { color: '#fff' }]}>
                                    {opt.label}
                                </Text>
                                <Text style={[styles.tenureRate, form.tenure === opt.value && { color: 'rgba(255,255,255,0.8)' }]}>
                                    {opt.rate}%
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {form.amount && parseFloat(form.amount) > 0 && (
                        <View style={styles.previewBox}>
                            <Text style={styles.previewTitle}>Estimated Returns</Text>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Principal</Text>
                                <Text style={styles.previewValue}>${parseFloat(form.amount).toLocaleString()}</Text>
                            </View>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Interest ({selectedTenure.rate}%)</Text>
                                <Text style={[styles.previewValue, { color: C.success }]}>+${interestEarned()}</Text>
                            </View>
                            <View style={[styles.previewRow, { borderTopWidth: 1, borderTopColor: C.border, marginTop: 8, paddingTop: 8 }]}>
                                <Text style={[styles.previewLabel, { ...FONTS.bold }]}>Maturity Amount</Text>
                                <Text style={[styles.previewValue, { color: C.primary, fontSize: 16 }]}>${maturityAmount()}</Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                        onPress={handleCreate}
                        disabled={submitting}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={[C.gradStart, C.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
                            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Fixed Deposit</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Fixed Deposits</Text>
                {deposits.length === 0 ? (
                    <View style={styles.card}>
                        <Text style={styles.emptyText}>No fixed deposits yet. Open your first FD above!</Text>
                    </View>
                ) : deposits.map((d, i) => (
                    <View key={d._id || i} style={styles.fdCard}>
                        <View style={styles.fdCardTop}>
                            <View>
                                <Text style={styles.fdAmount}>${(d.principal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                                <Text style={styles.fdTenure}>{d.tenure} months · {d.rate}% p.a.</Text>
                            </View>
                            <View style={[styles.fdStatusBadge, { backgroundColor: d.status === 'active' ? '#D1FAE5' : '#FEE2E2' }]}>
                                <Text style={[styles.fdStatusText, { color: d.status === 'active' ? C.success : C.danger }]}>
                                    {d.status?.charAt(0).toUpperCase() + d.status?.slice(1)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.fdDates}>
                            <Text style={styles.fdDate}>Start: {d.startDate}</Text>
                            <Text style={styles.fdDate}>Maturity: {d.maturityDate}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={{ height: 24 }} />
        </ScrollView>
    );
}

function getStyles(C) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: C.bg },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
        topBar: {
            paddingHorizontal: SPACING.md, paddingTop: 20, paddingBottom: 12,
            backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
        },
        homeBtn: {
            width: 40, height: 40, borderRadius: 20, backgroundColor: C.bg,
            justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border,
        },
        pageTitle: { ...FONTS.bold, fontSize: 22, color: C.text },
        pageSub: { ...FONTS.regular, fontSize: 13, color: C.textMuted, marginTop: 2 },
        banner: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, paddingHorizontal: SPACING.lg },
        bannerLabel: { ...FONTS.regular, color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 4 },
        bannerValue: { ...FONTS.extraBold, color: '#fff', fontSize: 24 },
        card: { backgroundColor: C.card, marginHorizontal: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
        cardTitle: { ...FONTS.bold, fontSize: 15, color: C.text, marginBottom: 14 },
        rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
        rateTenure: { ...FONTS.medium, fontSize: 14, color: C.text },
        rateBadge: { backgroundColor: C.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
        rateBadgeText: { ...FONTS.bold, fontSize: 13, color: C.primary },
        createBtn: { marginHorizontal: SPACING.md, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.md },
        createBtnInner: { paddingVertical: 14, alignItems: 'center' },
        createBtnText: { ...FONTS.bold, fontSize: 15, color: '#fff' },
        fieldLabel: { ...FONTS.semiBold, fontSize: 13, color: C.text, marginBottom: 8, marginTop: 12 },
        input: {
            borderWidth: 1.5, borderColor: C.border, borderRadius: RADIUS.md,
            paddingHorizontal: 14, paddingVertical: 12,
            fontSize: 15, color: C.text, backgroundColor: C.bg,
        },
        tenureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        tenureOption: {
            paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.md,
            backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, alignItems: 'center',
        },
        tenureSelected: { backgroundColor: C.primary, borderColor: C.primary },
        tenureText: { ...FONTS.semiBold, fontSize: 12, color: C.text },
        tenureRate: { ...FONTS.regular, fontSize: 11, color: C.textMuted, marginTop: 2 },
        previewBox: { backgroundColor: C.bg, borderRadius: RADIUS.md, padding: 14, marginTop: 16, borderWidth: 1, borderColor: C.border },
        previewTitle: { ...FONTS.semiBold, fontSize: 13, color: C.text, marginBottom: 10 },
        previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
        previewLabel: { ...FONTS.regular, fontSize: 13, color: C.textMuted },
        previewValue: { ...FONTS.semiBold, fontSize: 13, color: C.text },
        submitBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: 16 },
        submitBtnInner: { paddingVertical: 15, alignItems: 'center' },
        submitBtnText: { ...FONTS.bold, fontSize: 15, color: '#fff' },
        section: { paddingHorizontal: SPACING.md },
        sectionTitle: { ...FONTS.semiBold, fontSize: 15, color: C.text, marginBottom: 12 },
        fdCard: { backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
        fdCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
        fdAmount: { ...FONTS.extraBold, fontSize: 20, color: C.primary },
        fdTenure: { ...FONTS.regular, fontSize: 12, color: C.textMuted, marginTop: 2 },
        fdStatusBadge: { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4 },
        fdStatusText: { ...FONTS.bold, fontSize: 12 },
        fdDates: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
        fdDate: { ...FONTS.regular, fontSize: 12, color: C.textMuted },
        emptyText: { ...FONTS.regular, color: C.textMuted, textAlign: 'center', padding: 24 },
    });
}
