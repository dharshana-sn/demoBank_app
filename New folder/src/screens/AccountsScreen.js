import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl, Clipboard, Alert, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAccounts, getTransactions } from '../api/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../theme/theme';

const ACCOUNT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

export default function AccountsScreen({ navigation }) {
    const { C } = useTheme();
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTxn, setSelectedTxn] = useState(null);

    const styles = getStyles(C);

    const copyToClipboard = (text) => {
        Clipboard.setString(text);
        Alert.alert('Copied', 'Account number copied to clipboard!');
    };

    const load = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [accs, txns] = await Promise.all([
                getAccounts({ userId: user.id }),
                getTransactions({ userId: user.id })
            ]);
            setAccounts(accs);
            setTransactions(txns);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    useEffect(() => { load(); }, [load]);

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>
    );

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
        >
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.pageTitle}>My Accounts</Text>
                    <Text style={styles.pageSub}>Manage your linked accounts</Text>
                </View>
                <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Overview')}>
                    <Text style={{ fontSize: 20 }}>🏠</Text>
                </TouchableOpacity>
            </View>

            {/* Account Cards */}
            <View style={styles.section}>
                {accounts.filter(acc => acc.type !== 'credit').map((acc, i) => {
                    const color = acc.color || ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
                    const isNeg = acc.balance < 0;
                    return (
                        <View key={acc.id || i} style={[styles.accountCard, { borderLeftColor: color }]}>
                            <View style={styles.accountCardLeft}>
                                <View style={[styles.accIcon, { backgroundColor: `${color}22` }]}>
                                    <Text style={[styles.accIconText, { color }]}>💳</Text>
                                </View>
                                <TouchableOpacity onPress={() => copyToClipboard(acc.number)} style={{ flex: 1 }}>
                                    <Text style={styles.accName}>{acc.name}</Text>
                                    <Text style={styles.accNum}>{acc.number} · {acc.type?.charAt(0).toUpperCase() + acc.type?.slice(1)} 📋</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.accountCardRight}>
                                <Text style={[styles.accBalance, { color: isNeg ? C.danger : C.success }]}>
                                    {isNeg ? '-' : '+'}${Math.abs(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                                <Text style={styles.accStatus}>Active</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Summary Strip */}
            <View style={styles.summaryRow}>
                {[
                    { label: 'Total Accounts', value: accounts.length },
                    { label: 'Total Balance', value: `$${accounts.reduce((s, a) => s + a.balance, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                ].map(item => (
                    <View key={item.label} style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>{item.label}</Text>
                        <Text style={styles.summaryValue}>{item.value}</Text>
                    </View>
                ))}
            </View>

            {/* Recent Transactions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <View style={styles.card}>
                    {transactions.length === 0
                        ? <Text style={styles.emptyText}>No transactions found</Text>
                        : transactions.slice(0, 20).map((t, i) => (
                            <TouchableOpacity 
                                key={t._id || i} 
                                style={[styles.txRow, i < transactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}
                                onPress={() => setSelectedTxn(t)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.txIcon, { backgroundColor: t.type === 'credit' ? '#D1FAE5' : '#FEE2E2' }]}>
                                    <Text style={{ fontSize: 14 }}>{t.type === 'credit' ? '📈' : '📉'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.txDesc} numberOfLines={1}>{t.description}</Text>
                                    <Text style={styles.txMeta}>{t.category} · {t.date}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.txAmount, { color: t.type === 'credit' ? C.success : C.danger }]}>
                                        {t.type === 'credit' ? '+' : '-'}${Math.abs(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </Text>
                                    <Text style={[styles.txStatus, {
                                        color: t.status === 'Completed' ? C.success : t.status === 'Pending' ? C.warning : C.danger
                                    }]}>{t.status}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    }
                </View>
            </View>

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
        section: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
        sectionTitle: { ...FONTS.semiBold, fontSize: 15, color: C.text, marginBottom: SPACING.sm },
        accountCard: {
            backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            borderLeftWidth: 4, ...SHADOWS.sm,
        },
        accountCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
        accIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
        accIconText: { fontSize: 18 },
        accName: { ...FONTS.semiBold, fontSize: 14, color: C.text },
        accNum: { ...FONTS.regular, fontSize: 11, color: C.textMuted, marginTop: 2 },
        accountCardRight: { alignItems: 'flex-end' },
        accBalance: { ...FONTS.bold, fontSize: 15 },
        accStatus: { ...FONTS.regular, fontSize: 11, color: C.success, marginTop: 2 },
        summaryRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md, marginTop: SPACING.sm },
        summaryCard: { flex: 1, backgroundColor: C.card, borderRadius: RADIUS.md, padding: 14, ...SHADOWS.sm },
        summaryLabel: { ...FONTS.regular, fontSize: 11, color: C.textMuted, marginBottom: 4 },
        summaryValue: { ...FONTS.bold, fontSize: 16, color: C.primary },
        card: { backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
        emptyText: { ...FONTS.regular, color: C.textMuted, textAlign: 'center', padding: 24 },
        txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
        txIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
        txDesc: { ...FONTS.semiBold, fontSize: 13, color: C.text },
        txMeta: { ...FONTS.regular, fontSize: 11, color: C.textMuted, marginTop: 1 },
        txAmount: { ...FONTS.bold, fontSize: 13 },
        txStatus: { ...FONTS.medium, fontSize: 10, marginTop: 2 },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.md },
        modalContent: { backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.lg },
        modalTitle: { ...FONTS.bold, fontSize: 18, color: C.text, marginBottom: 12 },
        detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
        detailLabel: { ...FONTS.medium, fontSize: 13, color: C.textMuted },
        detailValue: { ...FONTS.bold, fontSize: 13, color: C.text, flex: 1, textAlign: 'right', marginLeft: 10 },
        modalCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: C.border },
        modalCancelText: { ...FONTS.medium, fontSize: 14, color: C.text },
    });
}
