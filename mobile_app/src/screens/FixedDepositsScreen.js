import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TextInput,
    TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFixedDeposits, createFixedDeposit, getAccounts, updateAccountBalance } from '../api/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
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
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [deposits, setDeposits] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ amount: '', tenure: 12, sourceAccount: '' });

    const styles = getStyles(C, insets);
    const selectedTenure = TENURE_OPTIONS.find(t => t.value === form.tenure) || TENURE_OPTIONS[2];

    useEffect(() => {
        if (!user?.id) return;
        Promise.all([getFixedDeposits({ userId: user.id }), getAccounts({ userId: user.id })])
            .then(([fds, accs]) => {
                setDeposits(fds);
                setAccounts(accs);
                const funding = accs.filter(acc => acc.type === 'checking' || acc.type === 'savings');
                if (funding.length > 0) {
                    setForm(f => ({ ...f, sourceAccount: funding[0].id }));
                }
            })
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
        const sourceAcc = accounts.find(a => a.id === form.sourceAccount);
        if (!sourceAcc || sourceAcc.balance < parseFloat(form.amount)) {
            Alert.alert('Error', 'Insufficient funds in source account.');
            return;
        }
        setSubmitting(true);
        try {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + form.tenure);
            const newFD = {
                userId: user.id,
                principal: parseFloat(form.amount),
                rate: selectedTenure.rate,
                tenure: String(form.tenure),
                startDate: startDate.toISOString().split('T')[0],
                maturityDate: endDate.toISOString().split('T')[0],
                maturityAmount: parseFloat(maturityAmount()),
                status: 'active',
            };
            const saved = await createFixedDeposit(newFD);
            await updateAccountBalance(form.sourceAccount, -parseFloat(form.amount));
            
            setDeposits(prev => [saved, ...prev]);
            setForm({ amount: '', tenure: 12, sourceAccount: form.sourceAccount });
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
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.pageTitle}>Fixed Deposits</Text>
                    <Text style={styles.pageSub}>Secure your future with high-yield deposits</Text>
                </View>
                <TouchableOpacity accessible={false} style={styles.homeBtn} onPress={() => navigation.goBack()}>
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
                <View style={styles.rateGrid}>
                    {TENURE_OPTIONS.map((opt, index) => {
                        const isLastOdd = TENURE_OPTIONS.length % 2 !== 0 && index === TENURE_OPTIONS.length - 1;
                        return (
                            <View
                                key={opt.value}
                                style={[
                                    styles.rateCard,
                                    isLastOdd && styles.rateCardLastOdd
                                ]}
                            >
                                <Text style={styles.rateTenure}>{opt.label}</Text>
                                <Text style={styles.ratePercent}>{opt.rate}%</Text>
                                <Text style={styles.ratePa}>per annum</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {!showForm && (
                <TouchableOpacity accessible={false} style={styles.createBtn} onPress={() => setShowForm(true)} activeOpacity={0.85}>
                    <LinearGradient colors={[C.gradStart, C.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnInner}>
                        <Text style={styles.createBtnText}>+ Open New Fixed Deposit</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {showForm && (
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={[styles.cardTitle, { marginBottom: 0 }]}>New Fixed Deposit</Text>
                        <TouchableOpacity accessible={false} onPress={() => setShowForm(false)} style={{ padding: 4 }}>
                            <Text style={{ ...FONTS.medium, color: C.danger, fontSize: 14 }}>✕ Cancel</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.fieldLabel}>Source Account</Text>
                    <View style={styles.pickerBox}>
                        {accounts.filter(acc => acc.type === 'checking' || acc.type === 'savings').map(acc => (
                            <TouchableOpacity accessible={false}
                                key={acc.id}
                                style={[styles.accOption, form.sourceAccount === acc.id && styles.accOptionSelected]}
                                onPress={() => setForm(f => ({ ...f, sourceAccount: acc.id }))}
                            >
                                <Text style={[styles.accOptionText, form.sourceAccount === acc.id && { color: '#fff' }]}>
                                    {acc.name}
                                </Text>
                                <Text style={[styles.accBalanceText, form.sourceAccount === acc.id && { color: 'rgba(255,255,255,0.75)' }]}>
                                    ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.fieldLabel}>Amount ($) · Min $500</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 5000"
                        placeholderTextColor={C.textLight}
                        value={form.amount}
                        onChangeText={v => {
                            // Strip any non-numeric characters except a single decimal point
                            const cleaned = v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                            setForm(f => ({ ...f, amount: cleaned }));
                        }}
                        keyboardType="numeric"
                        inputMode="numeric"
                    />
                    <Text style={styles.fieldLabel}>Tenure</Text>
                    <View style={styles.tenureGrid}>
                        {TENURE_OPTIONS.map(opt => (
                            <TouchableOpacity accessible={false}
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
                        <LinearGradient colors={[C.primary, '#1E3A8A']} style={styles.previewBox}>
                            <Text style={styles.previewTitle}>Your Returns</Text>
                            
                            <View style={styles.previewRateSection}>
                                <Text style={styles.previewRateValue}>{selectedTenure.rate}%</Text>
                                <Text style={styles.previewRateLabel}>Per Annum</Text>
                            </View>

                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Principal</Text>
                                <Text style={styles.previewValue}>${parseFloat(form.amount).toLocaleString()}</Text>
                            </View>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Interest Earned</Text>
                                <Text style={[styles.previewValue, { color: '#34D399' }]}>+${interestEarned()}</Text>
                            </View>
                            <View style={[styles.previewRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: 8, paddingTop: 8 }]}>
                                <Text style={[styles.previewLabel, { ...FONTS.bold, color: '#fff' }]}>Maturity Amount</Text>
                                <Text style={[styles.previewValue, { color: '#FCD34D', fontSize: 16 }]}>${maturityAmount()}</Text>
                            </View>
                        </LinearGradient>
                    )}

                    <TouchableOpacity accessible={false}
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

function getStyles(C, insets) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: C.bg },
        contentContainer: { paddingBottom: 16 },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
        topBar: {
            paddingHorizontal: SPACING.md,
            paddingTop: (insets.top > 0 ? insets.top : 44) + 8,
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
        banner: { 
            flexDirection: 'row', justifyContent: 'space-around', 
            paddingVertical: 20, paddingHorizontal: SPACING.lg,
            marginHorizontal: SPACING.md, borderRadius: RADIUS.lg,
            marginTop: SPACING.md, marginBottom: SPACING.sm
        },
        bannerLabel: { ...FONTS.regular, color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 4 },
        bannerValue: { ...FONTS.extraBold, color: '#fff', fontSize: 24 },
        card: { backgroundColor: C.card, marginHorizontal: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.sm },
        cardTitle: { ...FONTS.bold, fontSize: 16, color: C.text, marginBottom: 16 },
        rateGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
        rateCard: { width: '48%', backgroundColor: C.bg, padding: 16, borderRadius: RADIUS.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', marginBottom: 12 },
        rateCardLastOdd: { width: '100%' },
        rateTenure: { ...FONTS.medium, fontSize: 13, color: C.textMuted, marginBottom: 2 },
        ratePercent: { ...FONTS.extraBold, fontSize: 22, color: C.primary, marginVertical: 2 },
        ratePa: { ...FONTS.regular, fontSize: 10, color: C.textLight, marginTop: 2 },
        createBtn: { marginHorizontal: SPACING.md, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.md },
        createBtnInner: { paddingVertical: 14, alignItems: 'center' },
        createBtnText: { ...FONTS.bold, fontSize: 15, color: '#fff' },
        cancelBtn: { marginHorizontal: SPACING.md, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.md, borderWidth: 1.5, borderColor: C.danger, backgroundColor: C.bg },
        cancelBtnInner: { paddingVertical: 12, alignItems: 'center' },
        cancelBtnText: { ...FONTS.bold, fontSize: 15, color: C.danger },
        fieldLabel: { ...FONTS.semiBold, fontSize: 13, color: C.text, marginBottom: 8, marginTop: 12 },
        pickerBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
        accOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
        accOptionSelected: { backgroundColor: C.primary, borderColor: C.primary },
        accOptionText: { ...FONTS.medium, fontSize: 12, color: C.text },
        accBalanceText: { ...FONTS.regular, fontSize: 10, color: C.textMuted, marginTop: 1 },
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
        previewBox: { borderRadius: RADIUS.lg, padding: 16, marginTop: 16, overflow: 'hidden' },
        previewTitle: { ...FONTS.semiBold, fontSize: 14, color: '#fff', marginBottom: 12 },
        previewRateSection: { alignItems: 'center', marginVertical: 10 },
        previewRateValue: { ...FONTS.extraBold, fontSize: 32, color: '#fff' },
        previewRateLabel: { ...FONTS.regular, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
        previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
        previewLabel: { ...FONTS.regular, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
        previewValue: { ...FONTS.semiBold, fontSize: 13, color: '#fff' },
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
