import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, Modal, StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAccounts, createTransaction, updateAccountBalance, getTransactions, sameBankTransfer } from '../api/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { mockUsers } from '../utils/mockData';

export default function TransfersScreen({ navigation, route }) {
    const { C } = useTheme();
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [form, setForm] = useState({ from: '', to: '', amount: '', description: '' });
    const [payForm, setPayForm] = useState({ from: '', recipient: '', amount: '', note: '' });
    const [sbForm, setSbForm] = useState({ from: '', recipientAccount: '', recipientName: '', amount: '', note: '' });
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('internal');
    const [recentTransfers, setRecentTransfers] = useState([]);
    const [selectedTxn, setSelectedTxn] = useState(null);

    const styles = getStyles(C);

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
                navigation.setParams({ scannedRecipient: undefined, scannedAmount: undefined, scannedNote: undefined });
            }
        }, [route.params])
    );

    const loadData = useCallback(async () => {
        if (!user?.id) return;
        setPageLoading(true);
        try {
            const [accs, txns] = await Promise.all([
               getAccounts({ userId: user.id }),
                getTransactions({ userId: user.id }),
            ]);
            setAccounts(accs);
            if (accs.length >= 2) {
                setForm(f => ({ ...f, from: accs[0].id, to: accs[1].id }));
            }
            if (accs.length >= 1) {
                setPayForm(f => ({ ...f, from: f.from || accs[0].id }));
                setSbForm(f => ({ ...f, from: f.from || accs[0].id }));
            }
            const transfers = txns
                .filter(t => t.category === 'Transfers' || t.category === 'Internal Transfer')
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 20);
            setRecentTransfers(transfers);
        } catch (err) {
            console.error('Failed to load transfers:', err);
        } finally {
            setPageLoading(false);
        }
    }, [user?.id]);

    // Reload every time the screen comes into focus
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
                navigation.setParams({ scannedRecipient: undefined, scannedAmount: undefined, scannedNote: undefined });
            }
            loadData();
        }, [route.params, loadData])
    );

    useEffect(() => { loadData(); }, []);

    const handleTransfer = async () => {
        if (!form.amount || isNaN(parseFloat(form.amount))) {
            Alert.alert('Error', 'Please enter a valid amount.');
            return;
        }
        if (form.from === form.to) {
            Alert.alert('Error', 'Source and destination accounts must be different.');
            return;
        }
        const amt = parseFloat(form.amount);
        const fromAccount = accounts.find(a => a.id === form.from);
        if (!fromAccount || fromAccount.balance < amt) {
            Alert.alert('Insufficient Funds', `Available balance: $${(fromAccount?.balance ?? 0).toFixed(2)}`);
            return;
        }
        setLoading(true);
        try {
            const toAccount = accounts.find(a => a.id === form.to);
            const txn = {
                description: form.description || `Transfer to ${toAccount?.name || form.to}`,
                amount: -amt, type: 'debit', category: 'Internal Transfer',
                status: 'Completed', date: new Date().toISOString().split('T')[0],
                customerId: user.id,
                accountId: form.from,
                userId: user.id,
            };
            await createTransaction(txn);
            await Promise.all([
                updateAccountBalance(form.from, -amt),
                updateAccountBalance(form.to, +amt),
            ]);
            setForm(f => ({ ...f, amount: '', description: '' }));
            await loadData();
            Alert.alert('✅ Success', `$${amt.toFixed(2)} transferred successfully!`);
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        if (!payForm.from) {
            Alert.alert('Error', 'Please select an account to pay from.');
            return;
        }
        if (!payForm.recipient || !payForm.amount || isNaN(parseFloat(payForm.amount))) {
            Alert.alert('Error', 'Please fill in recipient and amount.');
            return;
        }
        const amt = parseFloat(payForm.amount);
        const fromAccount = accounts.find(a => a.id === payForm.from);
        if (!fromAccount || fromAccount.balance < amt) {
            Alert.alert('Insufficient Funds', `Available balance: $${(fromAccount?.balance ?? 0).toFixed(2)}`);
            return;
        }
        setLoading(true);
        try {
            const description = payForm.note
                ? `Payment to ${payForm.recipient}: ${payForm.note}`
                : `Payment to ${payForm.recipient}`;
            
            const recipientUser = mockUsers.find(u => u.name === payForm.recipient);
            const recipientAccountNum = recipientUser?.accountNumber;

            if (!recipientAccountNum) {
                throw new Error(`Could not find account number for ${payForm.recipient}`);
            }

            await sameBankTransfer({
                fromAccountId: payForm.from,
                toAccountNum: recipientAccountNum,
                amount: amt,
                senderUserId: user?.id,
                senderName: user?.name,
                note: description,
                date: new Date().toISOString().split('T')[0],
            });

            setPayForm(f => ({ from: f.from, recipient: '', amount: '', note: '' }));
            await loadData();
            Alert.alert(
                '✅ Payment Sent',
                `$${amt.toFixed(2)} sent to ${payForm.recipient} successfully!`
            );
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSameBankTransfer = async () => {
        if (!sbForm.from) {
            Alert.alert('Error', 'Please select an account to pay from.');
            return;
        }
        if (!sbForm.recipientAccount || !sbForm.recipientName || !sbForm.amount || isNaN(parseFloat(sbForm.amount))) {
            Alert.alert('Error', 'Please fill in all fields correctly.');
            return;
        }
        const amt = parseFloat(sbForm.amount);
        const fromAccount = accounts.find(a => a.id === sbForm.from);
        if (!fromAccount || fromAccount.balance < amt) {
            Alert.alert('Insufficient Funds', `Available balance: $${(fromAccount?.balance ?? 0).toFixed(2)}`);
            return;
        }
        setLoading(true);
        try {
            const result = await sameBankTransfer({
                fromAccountId: sbForm.from,
                toAccountNum: sbForm.recipientAccount,
                amount: amt,
                senderUserId: user?.id,
                senderName: user?.name,
                note: sbForm.note || '',
                date: new Date().toISOString().split('T')[0],
            });

            setSbForm(f => ({ from: f.from, recipientAccount: '', recipientName: '', amount: '', note: '' }));
            await loadData();
            Alert.alert(
                '✅ Success',
                `$${amt.toFixed(2)} transferred to ${sbForm.recipientName} successfully!`
            );
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return (
        <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="dark-content" backgroundColor={C.card} />
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
                    style={[styles.tab, activeTab === 'same-bank' && styles.tabActive]}
                    onPress={() => setActiveTab('same-bank')}
                >
                    <Text style={[styles.tabText, activeTab === 'same-bank' && styles.tabTextActive]}>Same Bank</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pay' && styles.tabActive]}
                    onPress={() => setActiveTab('pay')}
                >
                    <Text style={[styles.tabText, activeTab === 'pay' && styles.tabTextActive]}>Pay to User</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'internal' && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Transfer Between Accounts</Text>
                    <Text style={styles.fieldLabel}>From Account</Text>
                    <View style={styles.pickerBox}>
                        {accounts.filter(acc => acc.type !== 'credit' && acc.type !== 'investment').map(acc => (
                            <TouchableOpacity
                                key={acc.id}
                                style={[styles.accOption, form.from === acc.id && styles.accOptionSelected]}
                                onPress={() => setForm(f => ({ ...f, from: acc.id }))}
                            >
                                <Text style={[styles.accOptionText, form.from === acc.id && { color: '#fff' }]}>
                                    {acc.name}
                                </Text>
                                <Text style={[styles.accBalanceText, form.from === acc.id && { color: 'rgba(255,255,255,0.75)' }]}>
                                    ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.fieldLabel}>To Account</Text>
                    <View style={styles.pickerBox}>
                        {accounts.filter(acc => acc.type !== 'credit' && acc.type !== 'investment').map(acc => (
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
                        placeholderTextColor={C.textLight}
                        value={form.amount}
                        onChangeText={v => setForm(f => ({ ...f, amount: v }))}
                        keyboardType="numeric"
                    />
                    <Text style={styles.fieldLabel}>Description (optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Monthly savings"
                        placeholderTextColor={C.textLight}
                        value={form.description}
                        onChangeText={v => setForm(f => ({ ...f, description: v }))}
                    />
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                        onPress={handleTransfer}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={[C.gradStart, C.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Transfer Now</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {activeTab === 'same-bank' && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Same Bank Transfer</Text>
                    <Text style={styles.fieldLabel}>From Account</Text>
                    <View style={styles.pickerBox}>
                        {accounts.filter(acc => acc.type !== 'credit' && acc.type !== 'investment').map(acc => (
                            <TouchableOpacity
                                key={acc.id}
                                style={[styles.accOption, sbForm.from === acc.id && styles.accOptionSelected]}
                                onPress={() => setSbForm(f => ({ ...f, from: acc.id }))}
                            >
                                <Text style={[styles.accOptionText, sbForm.from === acc.id && { color: '#fff' }]}>
                                    {acc.name}
                                </Text>
                                <Text style={[styles.accBalanceText, sbForm.from === acc.id && { color: 'rgba(255,255,255,0.75)' }]}>
                                    ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.fieldLabel}>Recipient Account Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter account number"
                        placeholderTextColor={C.textLight}
                        value={sbForm.recipientAccount}
                        onChangeText={v => setSbForm(f => ({ ...f, recipientAccount: v }))}
                    />
                    <Text style={styles.fieldLabel}>Recipient Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. John Doe"
                        placeholderTextColor={C.textLight}
                        value={sbForm.recipientName}
                        onChangeText={v => setSbForm(f => ({ ...f, recipientName: v }))}
                    />
                    <Text style={styles.fieldLabel}>Amount ($)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor={C.textLight}
                        value={sbForm.amount}
                        onChangeText={v => setSbForm(f => ({ ...f, amount: v }))}
                        keyboardType="numeric"
                    />
                    <Text style={styles.fieldLabel}>Note (optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Rent, Gift"
                        placeholderTextColor={C.textLight}
                        value={sbForm.note}
                        onChangeText={v => setSbForm(f => ({ ...f, note: v }))}
                    />
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                        onPress={handleSameBankTransfer}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={[C.gradStart, C.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Transfer Funds</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {activeTab === 'pay' && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Pay to Another User</Text>
                    <TouchableOpacity
                        style={styles.qrScanBtn}
                        onPress={() => navigation.navigate('QRScanner')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient colors={[C.gradStart, C.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.qrScanBtnInner}>
                            <Text style={{ fontSize: 20, marginRight: 8 }}>📷</Text>
                            <Text style={styles.qrScanBtnText}>Scan QR Code</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <View style={styles.orDivider}>
                        <View style={styles.orLine} />
                        <Text style={styles.orText}>or enter manually</Text>
                        <View style={styles.orLine} />
                    </View>
                    <Text style={styles.fieldLabel}>From Account</Text>
                    <View style={styles.pickerBox}>
                        {accounts.filter(acc => acc.type !== 'credit' && acc.type !== 'investment').map(acc => (
                            <TouchableOpacity
                                key={acc.id}
                                style={[styles.accOption, payForm.from === acc.id && styles.accOptionSelected]}
                                onPress={() => setPayForm(f => ({ ...f, from: acc.id }))}
                            >
                                <Text style={[styles.accOptionText, payForm.from === acc.id && { color: '#fff' }]}>
                                    {acc.name}
                                </Text>
                                <Text style={[styles.accBalanceText, payForm.from === acc.id && { color: 'rgba(255,255,255,0.75)' }]}>
                                    ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.fieldLabel}>Select Recipient</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, paddingVertical: 4 }}>
                        {mockUsers.filter(u => u.id !== user?.id).map(u => (
                            <TouchableOpacity
                                key={u.id}
                                style={styles.userOption}
                                onPress={() => setPayForm(f => ({ ...f, recipient: u.name }))}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.userAvatar, payForm.recipient === u.name && { backgroundColor: C.primary, borderColor: C.primary }]}>
                                    <Text style={[styles.userAvatarText, payForm.recipient === u.name && { color: '#fff' }]}>{u.avatar}</Text>
                                </View>
                                <Text style={[styles.userNameText, payForm.recipient === u.name && { color: C.primary, ...FONTS.bold }]}>{u.name.split(' ')[0]}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <Text style={styles.fieldLabel}>Amount ($)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor={C.textLight}
                        value={payForm.amount}
                        onChangeText={v => setPayForm(f => ({ ...f, amount: v }))}
                        keyboardType="numeric"
                    />
                    <Text style={styles.fieldLabel}>Note (optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Rent payment"
                        placeholderTextColor={C.textLight}
                        value={payForm.note}
                        onChangeText={v => setPayForm(f => ({ ...f, note: v }))}
                    />
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                        onPress={handlePay}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={[C.gradStart, C.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Send Payment</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {recentTransfers.length > 0 && (
                <View style={[styles.card, { marginTop: SPACING.md }]}>
                    <Text style={styles.cardTitle}>Transfer History</Text>
                    {recentTransfers.map((t, i) => (
                        <TouchableOpacity 
                            key={t.id} 
                            style={[styles.txRow, i < recentTransfers.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}
                            onPress={() => setSelectedTxn(t)}
                            activeOpacity={0.7}
                        >
                            <Text style={{ fontSize: 20, marginRight: 10 }}>
                                {t.category === 'Internal Transfer' ? '🔄' : '💸'}
                            </Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.txDesc}>{t.description}</Text>
                                <Text style={styles.txMeta}>
                                    {t.category === 'Internal Transfer' ? 'Between Accounts' : 'Payment'} · {t.date}
                                </Text>
                            </View>
                            <Text style={{ ...FONTS.bold, color: t.category === 'Internal Transfer' ? C.textMuted : (t.type === 'credit' ? C.success : C.danger) }}>
                                {t.category === 'Internal Transfer' ? '↔' : (t.type === 'credit' ? '+' : '-')}${Math.abs(t.amount).toFixed(2)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Transaction Detail Modal */}
            <Modal visible={!!selectedTxn} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Transaction Details</Text>
                        
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Description</Text>
                            <Text style={styles.detailValue}>{selectedTxn?.description}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Recipient</Text>
                            <Text style={styles.detailValue}>
                                {(() => {
                                    const desc = selectedTxn?.description;
                                    if (!desc) return 'N/A';
                                    const m1 = desc.match(/^Payment to ([^:]+)/);
                                    if (m1) return m1[1].trim();
                                    const m2 = desc.match(/^Transfer to account (.+)/);
                                    if (m2) return m2[1].trim();
                                    const m3 = desc.match(/^Transfer from (.+)/);
                                    if (m3) return m3[1].trim();
                                    return 'N/A';
                                })()}
                            </Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Amount</Text>
                            <Text style={[styles.detailValue, { color: selectedTxn?.type === 'credit' ? C.success : C.danger }]}>
                                {selectedTxn?.type === 'credit' ? '+' : '-'}${Math.abs(selectedTxn?.amount || 0).toFixed(2)}
                            </Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Date</Text>
                            <Text style={styles.detailValue}>{selectedTxn?.date}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Category</Text>
                            <Text style={styles.detailValue}>{selectedTxn?.category}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Status</Text>
                            <Text style={[styles.detailValue, { color: C.success }]}>{selectedTxn?.status || 'Completed'}</Text>
                        </View>
 
                        <TouchableOpacity style={[styles.modalCancel, { marginTop: 20, alignSelf: 'flex-end' }]} onPress={() => setSelectedTxn(null)}>
                            <Text style={styles.modalCancelText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
 
            <View style={{ height: 24 }} />
        </ScrollView>
    );
}

function getStyles(C) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: C.bg },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
        qrScanBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 4 },
        qrScanBtnInner: { flexDirection: 'row', paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
        qrScanBtnText: { ...FONTS.bold, color: '#fff', fontSize: 15 },
        orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 8 },
        orLine: { flex: 1, height: 1, backgroundColor: C.border },
        userOption: { alignItems: 'center', marginRight: 16 },
        userAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border, ...SHADOWS.sm },
        userAvatarText: { ...FONTS.bold, fontSize: 16, color: C.text },
        userNameText: { ...FONTS.medium, fontSize: 12, color: C.textMuted, marginTop: 4 },
        orText: { ...FONTS.medium, fontSize: 12, color: C.textMuted },
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
        statsRow: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md },
        statCard: { flex: 1, backgroundColor: C.card, borderRadius: RADIUS.md, padding: 14, ...SHADOWS.sm },
        statLabel: { ...FONTS.regular, fontSize: 11, color: C.textMuted, marginBottom: 4 },
        statValue: { ...FONTS.bold, fontSize: 18, color: C.primary },
        tabsRow: { flexDirection: 'row', marginHorizontal: SPACING.md, marginBottom: SPACING.md, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: C.border },
        tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
        tabActive: { backgroundColor: C.primary },
        tabText: { ...FONTS.medium, fontSize: 13, color: C.textMuted },
        tabTextActive: { color: '#fff' },
        card: { backgroundColor: C.card, marginHorizontal: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
        cardTitle: { ...FONTS.bold, fontSize: 16, color: C.text, marginBottom: 16 },
        fieldLabel: { ...FONTS.semiBold, fontSize: 13, color: C.text, marginBottom: 6, marginTop: 12 },
        pickerBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        accOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
        accOptionSelected: { backgroundColor: C.primary, borderColor: C.primary },
        accOptionText: { ...FONTS.medium, fontSize: 12, color: C.text },
        accBalanceText: { ...FONTS.regular, fontSize: 10, color: C.textMuted, marginTop: 1 },
        input: {
            borderWidth: 1.5, borderColor: C.border, borderRadius: RADIUS.md,
            paddingHorizontal: 14, paddingVertical: 12,
            fontSize: 15, color: C.text, backgroundColor: C.bg,
        },
        submitBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: 20 },
        submitBtnInner: { paddingVertical: 15, alignItems: 'center' },
        submitBtnText: { ...FONTS.bold, fontSize: 15, color: '#fff' },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.md },
        modalContent: { backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.lg },
        modalTitle: { ...FONTS.bold, fontSize: 18, color: C.text, marginBottom: 12 },
        detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
        detailLabel: { ...FONTS.medium, fontSize: 13, color: C.textMuted },
        detailValue: { ...FONTS.bold, fontSize: 13, color: C.text, flex: 1, textAlign: 'right', marginLeft: 10 },
        modalCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: C.border },
        modalCancelText: { ...FONTS.medium, fontSize: 14, color: C.text },
        txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
        txDesc: { ...FONTS.semiBold, fontSize: 13, color: C.text },
        txMeta: { ...FONTS.regular, fontSize: 11, color: C.textMuted, marginTop: 2 },
    });
}
