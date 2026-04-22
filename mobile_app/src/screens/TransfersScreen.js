import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TextInput,
    TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAccounts, createTransaction, updateAccountBalance } from '../api/api';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function TransfersScreen({ navigation, route }) {
    const [accounts, setAccounts] = useState([]);
    const [form, setForm] = useState({ from: '', to: '', amount: '', description: '' });
    const [payForm, setPayForm] = useState({ recipient: '', amount: '', note: '' });
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('internal'); // 'internal' | 'pay'
    const [recentTransfers, setRecentTransfers] = useState([]);

    // Pre-fill form when returning from QR scanner
    useFocusEffect(
        useCallback(() => {
            const { scannedRecipient, scannedAmount, scannedNote } = route.params || {};
            if (scannedRecipient) {
                setActiveTab('pay');
                setPayForm(f => ({
                    ...f,
                    recipient: scannedRecipient,
                    amount: scannedAmount || f.amount,
                    note: scannedNote || f.note,
                }));
                // clear params so re-focus doesn't re-apply
                navigation.setParams({ scannedRecipient: undefined, scannedAmount: undefined, scannedNote: undefined });
            }
        }, [route.params])
    );

    useEffect(() => {
        getAccounts()
            .then(accs => {
                setAccounts(accs);
                if (accs.length >= 2) {
                    setForm(f => ({ ...f, from: accs[0].id, to: accs[1].id }));
                }
            })
            .catch(console.error)
            .finally(() => setPageLoading(false));
    }, []);

    const handleTransfer = async () => {
        if (!form.amount || isNaN(parseFloat(form.amount))) {
            Alert.alert('Error', 'Please enter a valid amount.');
            return;
        }
        if (form.from === form.to) {
            Alert.alert('Error', 'Source and destination accounts must be different.');
            return;
        }
        setLoading(true);
        try {
            const amt = parseFloat(form.amount);
            const fromAcc = accounts.find(a => a.id === form.from);
            const txn = {
                description: form.description || `Transfer to ${form.to}`,
                amount: -amt, type: 'debit', category: 'Transfers',
                status: 'Completed', date: new Date().toISOString().split('T')[0],
                customerId: 'CUST001',
            };
            await createTransaction(txn);
            await updateAccountBalance(form.from, -amt);
            setRecentTransfers(prev => [{ ...txn, id: Date.now() }, ...prev]);
            setForm(f => ({ ...f, amount: '', description: '' }));
            Alert.alert('✅ Success', `$${amt.toFixed(2)} transferred successfully!`);
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        if (!payForm.recipient || !payForm.amount || isNaN(parseFloat(payForm.amount))) {
            Alert.alert('Error', 'Please fill in recipient and amount.');
            return;
        }
        setLoading(true);
        try {
            const amt = parseFloat(payForm.amount);
            const txn = {
                description: payForm.note || `Payment to ${payForm.recipient}`,
                amount: -amt, type: 'debit', category: 'Transfers',
                status: 'Completed', date: new Date().toISOString().split('T')[0],
                customerId: payForm.recipient,
            };
            await createTransaction(txn);
            setRecentTransfers(prev => [{ ...txn, id: Date.now() }, ...prev]);
            setPayForm({ recipient: '', amount: '', note: '' });
            Alert.alert('✅ Success', `Payment of $${amt.toFixed(2)} sent!`);
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.pageTitle}>Fund Transfers</Text>
                    <Text style={styles.pageSub}>Move money securely</Text>
                </View>
                <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Overview')}>
                    <Text style={{ fontSize: 20 }}>🏠</Text>
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                {[{ label: 'This Month', value: recentTransfers.length.toString() },
                  { label: 'Total Sent', value: `$${recentTransfers.reduce((s, t) => s + Math.abs(t.amount), 0).toFixed(2)}` }].map(s => (
                    <View key={s.label} style={styles.statCard}>
                        <Text style={styles.statLabel}>{s.label}</Text>
                        <Text style={styles.statValue}>{s.value}</Text>
                    </View>
                ))}
            </View>

            {/* Tabs */}
            <View style={styles.tabsRow}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'internal' && styles.tabActive]}
                    onPress={() => setActiveTab('internal')}
                >
                    <Text style={[styles.tabText, activeTab === 'internal' && styles.tabTextActive]}>Between Accounts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pay' && styles.tabActive]}
                    onPress={() => setActiveTab('pay')}
                >
                    <Text style={[styles.tabText, activeTab === 'pay' && styles.tabTextActive]}>Pay to User</Text>
                </TouchableOpacity>
            </View>

            {/* Internal transfer form */}
            {activeTab === 'internal' && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Transfer Between Accounts</Text>
                    <Text style={styles.fieldLabel}>From Account</Text>
                    <View style={styles.pickerBox}>
                        {accounts.map(acc => (
                            <TouchableOpacity
                                key={acc.id}
                                style={[styles.accOption, form.from === acc.id && styles.accOptionSelected]}
                                onPress={() => setForm(f => ({ ...f, from: acc.id }))}
                            >
                                <Text style={[styles.accOptionText, form.from === acc.id && { color: '#fff' }]}>
                                    {acc.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.fieldLabel}>To Account</Text>
                    <View style={styles.pickerBox}>
                        {accounts.map(acc => (
                            <TouchableOpacity
                                key={acc.id}
                                style={[styles.accOption, form.to === acc.id && styles.accOptionSelected]}
                                onPress={() => setForm(f => ({ ...f, to: acc.id }))}
                            >
                                <Text style={[styles.accOptionText, form.to === acc.id && { color: '#fff' }]}>
                                    {acc.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.fieldLabel}>Amount ($)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor={COLORS.textLight}
                        value={form.amount}
                        onChangeText={v => setForm(f => ({ ...f, amount: v }))}
                        keyboardType="numeric"
                    />
                    <Text style={styles.fieldLabel}>Description (optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Monthly savings"
                        placeholderTextColor={COLORS.textLight}
                        value={form.description}
                        onChangeText={v => setForm(f => ({ ...f, description: v }))}
                    />
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                        onPress={handleTransfer}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={[COLORS.gradStart, COLORS.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Transfer Now</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {/* Pay to user form */}
            {activeTab === 'pay' && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Pay to Another User</Text>

                    {/* QR Scan Button */}
                    <TouchableOpacity
                        style={styles.qrScanBtn}
                        onPress={() => navigation.navigate('QRScanner')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[COLORS.gradStart, COLORS.gradEnd]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.qrScanBtnInner}
                        >
                            <Text style={{ fontSize: 20, marginRight: 8 }}>📷</Text>
                            <Text style={styles.qrScanBtnText}>Scan QR Code</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.orDivider}>
                        <View style={styles.orLine} />
                        <Text style={styles.orText}>or enter manually</Text>
                        <View style={styles.orLine} />
                    </View>

                    <Text style={styles.fieldLabel}>Recipient ID / Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. CUST002"
                        placeholderTextColor={COLORS.textLight}
                        value={payForm.recipient}
                        onChangeText={v => setPayForm(f => ({ ...f, recipient: v }))}
                    />
                    <Text style={styles.fieldLabel}>Amount ($)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor={COLORS.textLight}
                        value={payForm.amount}
                        onChangeText={v => setPayForm(f => ({ ...f, amount: v }))}
                        keyboardType="numeric"
                    />
                    <Text style={styles.fieldLabel}>Note (optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Rent payment"
                        placeholderTextColor={COLORS.textLight}
                        value={payForm.note}
                        onChangeText={v => setPayForm(f => ({ ...f, note: v }))}
                    />
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                        onPress={handlePay}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={[COLORS.gradStart, COLORS.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Send Payment</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {/* Transfer History */}
            {recentTransfers.length > 0 && (
                <View style={[styles.card, { marginTop: SPACING.md }]}>
                    <Text style={styles.cardTitle}>This Session's Transfers</Text>
                    {recentTransfers.map((t, i) => (
                        <View key={t.id} style={[styles.txRow, i < recentTransfers.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.border }]}>
                            <Text style={{ fontSize: 20, marginRight: 10 }}>💸</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.txDesc}>{t.description}</Text>
                                <Text style={styles.txMeta}>{t.date}</Text>
                            </View>
                            <Text style={{ ...FONTS.bold, color: COLORS.danger }}>
                                -${Math.abs(t.amount).toFixed(2)}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={{ height: 24 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    qrScanBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 4 },
    qrScanBtnInner: { flexDirection: 'row', paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    qrScanBtnText: { ...FONTS.bold, color: '#fff', fontSize: 15 },
    orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 8 },
    orLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
    orText: { ...FONTS.medium, fontSize: 12, color: COLORS.textMuted },
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
    statsRow: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md },
    statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 14, ...SHADOWS.sm },
    statLabel: { ...FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
    statValue: { ...FONTS.bold, fontSize: 18, color: COLORS.primary },
    tabsRow: { flexDirection: 'row', marginHorizontal: SPACING.md, marginBottom: SPACING.md, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: COLORS.border },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    tabActive: { backgroundColor: COLORS.primary },
    tabText: { ...FONTS.medium, fontSize: 13, color: COLORS.textMuted },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: COLORS.card, marginHorizontal: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
    cardTitle: { ...FONTS.bold, fontSize: 16, color: COLORS.text, marginBottom: 16 },
    fieldLabel: { ...FONTS.semiBold, fontSize: 13, color: COLORS.text, marginBottom: 6, marginTop: 12 },
    pickerBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    accOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: COLORS.border },
    accOptionSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    accOptionText: { ...FONTS.medium, fontSize: 12, color: COLORS.text },
    input: {
        borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: COLORS.text, backgroundColor: '#F8FAFC',
    },
    submitBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: 20 },
    submitBtnInner: { paddingVertical: 15, alignItems: 'center' },
    submitBtnText: { ...FONTS.bold, fontSize: 15, color: '#fff' },
    txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    txDesc: { ...FONTS.semiBold, fontSize: 13, color: COLORS.text },
    txMeta: { ...FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
