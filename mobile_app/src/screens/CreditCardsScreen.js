import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl, TextInput, Alert, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAccounts, getTransactions, updateAccount, createAccount, createTransaction, updateAccountBalance } from '../api/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function CreditCardsScreen({ navigation }) {
    const { C } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedTxn, setSelectedTxn] = useState(null);

    // Form states
    const [payAmount, setPayAmount] = useState('');
    const [payNote, setPayNote] = useState('');
    const [sourceAccountId, setSourceAccountId] = useState('');
    const [newLimit, setNewLimit] = useState('');
    const [manualTxn, setManualTxn] = useState({ description: '', category: 'Shopping', amount: '' });

    // Modal states
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showManualTxnModal, setShowManualTxnModal] = useState(false);
    const [showStatement, setShowStatement] = useState(false);

    const styles = getStyles(C, insets);

    const loadData = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [accs, txns] = await Promise.all([
                getAccounts({ userId: user.id }),
                getTransactions({ userId: user.id })
            ]);
            setAccounts(accs);
            setTransactions(txns);
            
            // Auto-select first funding account
            const funding = accs.filter(acc => acc.type === 'checking' || acc.type === 'savings');
            if (funding.length > 0 && !sourceAccountId) {
                setSourceAccountId(funding[0].id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, sourceAccountId]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    useEffect(() => { loadData(); }, [loadData]);

    const creditCard = accounts.find(acc => acc.type === 'credit');
    const fundingAccounts = accounts.filter(acc => acc.type === 'checking' || acc.type === 'savings');
    const outstandingBalance = creditCard && creditCard.balance < 0 ? Math.abs(creditCard.balance) : 0;
    const availableLimit = creditCard ? (creditCard.limit || 0) + creditCard.balance : 0;

    const statementTxns = creditCard ? transactions.filter(t => 
        t.accountId === creditCard.id || 
        t.fromAccountId === creditCard.id || 
        t.toAccountId === creditCard.id
    ).sort((a, b) => new Date(b.date) - new Date(a.date)) : [];

    const handlePayment = async () => {
        const amt = parseFloat(payAmount);
        if (!amt || amt <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }
        if (!creditCard) { Alert.alert('Error', 'No credit card found'); return; }
        
        const sourceAccount = fundingAccounts.find(a => a.id === sourceAccountId);
        if (!sourceAccount || sourceAccount.balance < amt) {
            Alert.alert('Error', 'Insufficient funds in source account'); return;
        }

        setIsProcessing(true);
        try {
            const txn = {
                description: `Credit Card Payment - ${creditCard.name}`,
                category: 'Credit Card',
                amount: -amt,
                status: 'Completed',
                type: 'debit',
                fromAccountId: sourceAccountId,
                toAccountId: creditCard.id,
                accountId: sourceAccountId,
                date: new Date().toISOString().split('T')[0],
                userId: user.id,
                note: payNote
            };

            await createTransaction(txn);
            await updateAccountBalance(sourceAccountId, -amt);
            await updateAccountBalance(creditCard.id, +amt);

            Alert.alert('Success', `Successfully paid $${amt.toLocaleString()} to ${creditCard.name}`);
            setPayAmount('');
            setPayNote('');
            loadData();
        } catch (err) {
            Alert.alert('Error', 'Payment failed: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateLimit = async () => {
        const limit = parseFloat(newLimit);
        if (!limit || isNaN(limit)) { Alert.alert('Error', 'Please enter a valid limit'); return; }
        
        setIsProcessing(true);
        try {
            await updateAccount(creditCard.id, { limit: limit });
            Alert.alert('Success', `Credit limit updated to $${limit.toLocaleString()}`);
            setShowLimitModal(false);
            setNewLimit('');
            loadData();
        } catch (err) {
            Alert.alert('Error', 'Failed to update limit: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualTransaction = async () => {
        const amt = parseFloat(manualTxn.amount);
        if (!amt || amt <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }
        if (!manualTxn.description) { Alert.alert('Error', 'Please enter a description'); return; }

        setIsProcessing(true);
        try {
            const txn = {
                description: manualTxn.description,
                category: manualTxn.category,
                amount: -amt,
                status: 'Completed',
                type: 'debit',
                accountId: creditCard.id,
                date: new Date().toISOString().split('T')[0],
                userId: user.id
            };

            await createTransaction(txn);
            await updateAccountBalance(creditCard.id, -amt);

            Alert.alert('Success', `Recorded ${manualTxn.description} of $${amt.toLocaleString()}`);
            setManualTxn({ description: '', category: 'Shopping', amount: '' });
            setShowManualTxnModal(false);
            loadData();
        } catch (err) {
            Alert.alert('Error', 'Failed to record transaction: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApplyNewCard = async (type) => {
        setIsProcessing(true);
        try {
            const cardNames = { gold: 'Gold Rewards Card', platinum: 'Platinum Credit Card', travel: 'Global Traveler Card' };
            const newCard = {
                id: `acc-${Date.now()}`,
                name: cardNames[type],
                number: `****${Math.floor(1000 + Math.random() * 9000)}`,
                balance: 0,
                type: 'credit',
                limit: type === 'gold' ? 30000 : type === 'platinum' ? 70000 : 50000,
                color: type === 'gold' ? '#F59E0B' : type === 'platinum' ? '#4F46E5' : '#10B981',
                status: 'active',
                userId: user.id
            };

            await createAccount(newCard);
            Alert.alert('Success', `Your application for ${newCard.name} has been approved!`);
            setShowApplyModal(false);
            loadData();
        } catch (err) {
            Alert.alert('Error', 'Application failed: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>
    );

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={C.primary} />}
        >
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.pageTitle}>Credit Cards</Text>
                    <Text style={styles.pageSub}>Manage your cards and payments</Text>
                </View>
                <TouchableOpacity accessible={false} style={styles.homeBtn} onPress={() => navigation.goBack()}>
                    <Text style={{ fontSize: 20 }}>🏠</Text>
                </TouchableOpacity>
            </View>

            {creditCard ? (
                <View style={styles.section}>
                    {/* Physical Card Visual */}
                    <LinearGradient
                        colors={[creditCard.color || '#4F46E5', `${creditCard.color || '#4F46E5'}BB`]}
                        style={styles.creditCard}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.bankName}>{creditCard.name.toUpperCase()}</Text>
                            <Text style={styles.contactless}>📶</Text>
                        </View>
                        
                        <View style={styles.chipContainer}>
                            <View style={styles.cardChip} />
                        </View>

                        <Text style={styles.cardNumber}>
                            {creditCard.number ? creditCard.number.replace(/\*/g, '•').replace(/(.{4})/g, '$1  ').trim() : '••••  ••••  ••••  ••••'}
                        </Text>
                        
                        <View style={styles.cardFooter}>
                            <View>
                                <Text style={styles.cardLabel}>CARD HOLDER</Text>
                                <Text style={styles.cardValue}>{user?.name ? user.name.toUpperCase() : 'DEMO USER'}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.cardLabel}>EXPIRES</Text>
                                <Text style={styles.cardValue}>12/29</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Balance Info */}
                    <View style={styles.balanceGrid}>
                        <View style={styles.balanceItem}>
                            <Text style={styles.balanceLabel}>Due Amount</Text>
                            <Text style={[styles.balanceValue, { color: C.danger }]}>
                                ${outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <View style={styles.balanceItem}>
                            <Text style={styles.balanceLabel}>Available Limit</Text>
                            <Text style={[styles.balanceValue, { color: C.success }]}>
                                ${availableLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    </View>

                    {/* Quick Pay */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Quick Pay</Text>
                        
                        <Text style={styles.fieldLabel}>Pay From Account</Text>
                        <View style={styles.pickerBox}>
                            {fundingAccounts.map(acc => (
                                <TouchableOpacity accessible={false}
                                    key={acc.id}
                                    style={[styles.accOption, sourceAccountId === acc.id && styles.accOptionSelected]}
                                    onPress={() => setSourceAccountId(acc.id)}
                                >
                                    <Text style={[styles.accOptionText, sourceAccountId === acc.id && { color: '#fff' }]}>
                                        {acc.name}
                                    </Text>
                                    <Text style={[styles.accBalanceText, sourceAccountId === acc.id && { color: 'rgba(255,255,255,0.75)' }]}>
                                        ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.fieldLabel}>Amount ($)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor={C.textLight}
                            value={payAmount}
                            onChangeText={setPayAmount}
                            keyboardType="numeric"
                        />

                        <Text style={styles.fieldLabel}>Notes (optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Monthly payment"
                            placeholderTextColor={C.textLight}
                            value={payNote}
                            onChangeText={setPayNote}
                        />

                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            <TouchableOpacity accessible={false} style={styles.smallBtn} onPress={() => setPayAmount(outstandingBalance.toString())}>
                                <Text style={styles.smallBtnText}>Pay Full</Text>
                            </TouchableOpacity>
                            <TouchableOpacity accessible={false} style={styles.smallBtn} onPress={() => setPayAmount((outstandingBalance * 0.1).toFixed(2))}>
                                <Text style={styles.smallBtnText}>Pay Min (10%)</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity accessible={false}
                            style={[styles.submitBtn, (isProcessing || outstandingBalance <= 0) && { opacity: 0.6 }]}
                            onPress={handlePayment}
                            disabled={isProcessing || outstandingBalance <= 0}
                        >
                            <LinearGradient colors={[C.gradStart, C.gradEnd]} style={styles.submitBtnInner}>
                                {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Make Payment</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Settings / Actions */}
                    <View style={[styles.card, { marginTop: SPACING.md }]}>
                        <Text style={styles.sectionTitle}>Card Settings</Text>
                        
                        <TouchableOpacity accessible={false} style={styles.actionRow} onPress={() => setShowLimitModal(true)}>
                            <Text style={{ fontSize: 18 }}>➡️</Text>
                            <Text style={styles.actionText}>Manage Credit Limit</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity accessible={false} style={styles.actionRow} onPress={() => setShowStatement(!showStatement)}>
                            <Text style={{ fontSize: 18 }}>📄</Text>
                            <Text style={styles.actionText}>{showStatement ? 'Hide Statement' : 'View Card Statement'}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity accessible={false} style={styles.actionRow} onPress={() => setShowManualTxnModal(true)}>
                            <Text style={{ fontSize: 18 }}>➕</Text>
                            <Text style={styles.actionText}>Record New Purchase</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Statement Section */}
                    {showStatement && (
                        <View style={[styles.card, { marginTop: SPACING.md }]}>
                            <Text style={styles.sectionTitle}>Card Statement</Text>
                            {statementTxns.length === 0 ? (
                                <Text style={styles.emptyText}>No transactions found</Text>
                            ) : (
                                statementTxns.map((t, i) => (
                                    <TouchableOpacity accessible={false} 
                                        key={t.id || i} 
                                        style={[styles.txRow, i < statementTxns.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}
                                        onPress={() => setSelectedTxn(t)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.txDesc}>{t.description}</Text>
                                            <Text style={styles.txMeta}>{t.category} · {t.date}</Text>
                                        </View>
                                        <Text style={{ ...FONTS.bold, color: t.amount < 0 ? C.danger : C.success }}>
                                            {t.amount < 0 ? '-' : '+'}${Math.abs(t.amount).toFixed(2)}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>💳</Text>
                    <Text style={styles.emptyTitle}>No Credit Card Found</Text>
                    <Text style={styles.emptySub}>Apply for a card to get started.</Text>
                    <TouchableOpacity accessible={false} style={styles.applyBtn} onPress={() => setShowApplyModal(true)}>
                        <LinearGradient colors={[C.gradStart, C.gradEnd]} style={styles.applyBtnInner}>
                            <Text style={styles.applyBtnText}>Apply Now</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {/* Modals */}
            
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
                                {selectedTxn?.description?.startsWith('Payment to ') 
                                    ? selectedTxn.description.substring(11).split(':')[0].trim()
                                    : (selectedTxn?.description?.startsWith('Transfer to account ')
                                        ? selectedTxn.description.substring(20).trim()
                                        : (selectedTxn?.description?.startsWith('Transfer from ')
                                            ? selectedTxn.description.substring(14).trim()
                                            : 'N/A'))}
                            </Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Amount</Text>
                            <Text style={[styles.detailValue, { color: selectedTxn?.amount < 0 ? C.danger : C.success }]}>
                                {selectedTxn?.amount < 0 ? '-' : '+'}${Math.abs(selectedTxn?.amount || 0).toFixed(2)}
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
 
                        <TouchableOpacity accessible={false} style={[styles.modalCancel, { marginTop: 20, alignSelf: 'flex-end' }]} onPress={() => setSelectedTxn(null)}>
                            <Text style={styles.modalCancelText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            {/* Limit Modal */}
            <Modal visible={showLimitModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Manage Credit Limit</Text>
                        <Text style={styles.fieldLabel}>New Requested Limit ($)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter new limit"
                            placeholderTextColor={C.textLight}
                            value={newLimit}
                            onChangeText={setNewLimit}
                            keyboardType="numeric"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity accessible={false} style={styles.modalCancel} onPress={() => setShowLimitModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity accessible={false} style={styles.modalSubmit} onPress={handleUpdateLimit}>
                                <Text style={styles.modalSubmitText}>Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Manual Txn Modal */}
            <Modal visible={showManualTxnModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Record New Purchase</Text>
                        
                        <Text style={styles.fieldLabel}>Description</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Apple Store"
                            placeholderTextColor={C.textLight}
                            value={manualTxn.description}
                            onChangeText={v => setManualTxn({ ...manualTxn, description: v })}
                        />

                        <Text style={styles.fieldLabel}>Amount ($)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor={C.textLight}
                            value={manualTxn.amount}
                            onChangeText={v => setManualTxn({ ...manualTxn, amount: v })}
                            keyboardType="numeric"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity accessible={false} style={styles.modalCancel} onPress={() => setShowManualTxnModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity accessible={false} style={styles.modalSubmit} onPress={handleManualTransaction}>
                                <Text style={styles.modalSubmitText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Apply Modal */}
            <Modal visible={showApplyModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Apply for a Credit Card</Text>
                        <Text style={styles.modalSub}>Select a card type:</Text>
                        
                        <TouchableOpacity accessible={false} style={styles.cardOption} onPress={() => handleApplyNewCard('platinum')}>
                            <Text style={[styles.cardOptionTitle, { color: '#4F46E5' }]}>Platinum Credit Card</Text>
                            <Text style={styles.cardOptionDetail}>Limit: $70,000 · Premium rewards</Text>
                        </TouchableOpacity>

                        <TouchableOpacity accessible={false} style={styles.cardOption} onPress={() => handleApplyNewCard('gold')}>
                            <Text style={[styles.cardOptionTitle, { color: '#F59E0B' }]}>Gold Rewards Card</Text>
                            <Text style={styles.cardOptionDetail}>Limit: $30,000 · Everyday spending</Text>
                        </TouchableOpacity>

                        <TouchableOpacity accessible={false} style={styles.cardOption} onPress={() => handleApplyNewCard('travel')}>
                            <Text style={[styles.cardOptionTitle, { color: '#10B981' }]}>Global Traveler Card</Text>
                            <Text style={styles.cardOptionDetail}>Limit: $50,000 · Zero forex fees</Text>
                        </TouchableOpacity>

                        <TouchableOpacity accessible={false} style={[styles.modalCancel, { marginTop: 12 }]} onPress={() => setShowApplyModal(false)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
        section: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
        creditCard: {
            borderRadius: RADIUS.lg, padding: SPACING.lg, height: 210,
            justifyContent: 'space-between', ...SHADOWS.lg,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
        },
        cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        bankName: { ...FONTS.bold, fontSize: 14, color: '#fff', opacity: 0.95, letterSpacing: 0.5 },
        contactless: { fontSize: 20, color: '#fff', opacity: 0.8 },
        chipContainer: { marginVertical: 4 },
        cardChip: {
            width: 40, height: 30, borderRadius: 6,
            backgroundColor: '#F59E0B', opacity: 0.85,
            borderWidth: 1, borderColor: '#D97706'
        },
        cardNumber: { ...FONTS.bold, fontSize: 20, color: '#fff', letterSpacing: 2, textAlign: 'center', marginVertical: 12 },
        cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        cardLabel: { ...FONTS.regular, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
        cardValue: { ...FONTS.bold, fontSize: 12, color: '#fff', marginTop: 2, letterSpacing: 0.5 },
        balanceGrid: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
        balanceItem: { flex: 1, backgroundColor: C.card, borderRadius: RADIUS.md, padding: 14, ...SHADOWS.sm },
        balanceLabel: { ...FONTS.regular, fontSize: 11, color: C.textMuted, marginBottom: 4 },
        balanceValue: { ...FONTS.bold, fontSize: 16 },
        card: { backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm, marginTop: SPACING.md },
        sectionTitle: { ...FONTS.bold, fontSize: 16, color: C.text, marginBottom: 16 },
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
        smallBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm, backgroundColor: C.border },
        smallBtnText: { ...FONTS.medium, fontSize: 11, color: C.text },
        submitBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: 20 },
        submitBtnInner: { paddingVertical: 15, alignItems: 'center' },
        submitBtnText: { ...FONTS.bold, fontSize: 15, color: '#fff' },
        actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
        actionText: { ...FONTS.medium, fontSize: 14, color: C.text },
        emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
        emptyTitle: { ...FONTS.bold, fontSize: 20, color: C.text, marginBottom: 8 },
        emptySub: { ...FONTS.regular, fontSize: 14, color: C.textMuted, marginBottom: 24 },
        applyBtn: { borderRadius: RADIUS.md, overflow: 'hidden', width: '100%' },
        applyBtnInner: { paddingVertical: 14, alignItems: 'center' },
        applyBtnText: { ...FONTS.bold, fontSize: 15, color: '#fff' },
        emptyText: { ...FONTS.regular, color: C.textMuted, textAlign: 'center', padding: 24 },
        txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
        txDesc: { ...FONTS.semiBold, fontSize: 13, color: C.text },
        txMeta: { ...FONTS.regular, fontSize: 11, color: C.textMuted, marginTop: 2 },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.md },
        modalContent: { backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.lg },
        modalTitle: { ...FONTS.bold, fontSize: 18, color: C.text, marginBottom: 12 },
        modalSub: { ...FONTS.regular, fontSize: 14, color: C.textMuted, marginBottom: 12 },
        modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
        modalCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: C.border },
        modalCancelText: { ...FONTS.medium, fontSize: 14, color: C.text },
        modalSubmit: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: C.primary },
        modalSubmitText: { ...FONTS.medium, fontSize: 14, color: '#fff' },
        cardOption: { padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
        cardOptionTitle: { ...FONTS.bold, fontSize: 14 },
        cardOptionDetail: { ...FONTS.regular, fontSize: 12, color: C.textMuted, marginTop: 2 },
        detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
        detailLabel: { ...FONTS.medium, fontSize: 13, color: C.textMuted },
        detailValue: { ...FONTS.bold, fontSize: 13, color: C.text, flex: 1, textAlign: 'right', marginLeft: 10 },
    });
}
