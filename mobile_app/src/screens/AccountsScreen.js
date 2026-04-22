import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl
} from 'react-native';
import { getAccounts, getTransactions } from '../api/api';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme/theme';

const ACCOUNT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

export default function AccountsScreen({ navigation }) {
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        try {
            const [accs, txns] = await Promise.all([getAccounts(), getTransactions()]);
            setAccounts(accs);
            setTransactions(txns);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { load(); }, []);

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
    );

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
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
                {accounts.map((acc, i) => {
                    const color = acc.color || ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
                    const isNeg = acc.balance < 0;
                    return (
                        <View key={acc.id || i} style={[styles.accountCard, { borderLeftColor: color }]}>
                            <View style={styles.accountCardLeft}>
                                <View style={[styles.accIcon, { backgroundColor: `${color}22` }]}>
                                    <Text style={[styles.accIconText, { color }]}>💳</Text>
                                </View>
                                <View>
                                    <Text style={styles.accName}>{acc.name}</Text>
                                    <Text style={styles.accNum}>{acc.number} · {acc.type?.charAt(0).toUpperCase() + acc.type?.slice(1)}</Text>
                                </View>
                            </View>
                            <View style={styles.accountCardRight}>
                                <Text style={[styles.accBalance, { color: isNeg ? COLORS.danger : COLORS.success }]}>
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
                            <View key={t._id || i} style={[styles.txRow, i < transactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.border }]}>
                                <View style={[styles.txIcon, { backgroundColor: t.type === 'credit' ? '#D1FAE5' : '#FEE2E2' }]}>
                                    <Text style={{ fontSize: 14 }}>{t.type === 'credit' ? '📈' : '📉'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.txDesc} numberOfLines={1}>{t.description}</Text>
                                    <Text style={styles.txMeta}>{t.category} · {t.date}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.txAmount, { color: t.type === 'credit' ? COLORS.success : COLORS.danger }]}>
                                        {t.type === 'credit' ? '+' : '-'}${Math.abs(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </Text>
                                    <Text style={[styles.txStatus, {
                                        color: t.status === 'Completed' ? COLORS.success : t.status === 'Pending' ? COLORS.warning : COLORS.danger
                                    }]}>{t.status}</Text>
                                </View>
                            </View>
                        ))
                    }
                </View>
            </View>

            <View style={{ height: 24 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
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
    section: { paddingHorizontal: SPACING.md, marginTop: SPACING.md },
    sectionTitle: { ...FONTS.semiBold, fontSize: 15, color: COLORS.text, marginBottom: SPACING.sm },
    accountCard: {
        backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
        padding: SPACING.md, marginBottom: SPACING.sm,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderLeftWidth: 4, ...SHADOWS.sm,
    },
    accountCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    accIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    accIconText: { fontSize: 18 },
    accName: { ...FONTS.semiBold, fontSize: 14, color: COLORS.text },
    accNum: { ...FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
    accountCardRight: { alignItems: 'flex-end' },
    accBalance: { ...FONTS.bold, fontSize: 15 },
    accStatus: { ...FONTS.regular, fontSize: 11, color: COLORS.success, marginTop: 2 },
    summaryRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md, marginTop: SPACING.sm },
    summaryCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 14, ...SHADOWS.sm },
    summaryLabel: { ...FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
    summaryValue: { ...FONTS.bold, fontSize: 16, color: COLORS.primary },
    card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
    emptyText: { ...FONTS.regular, color: COLORS.textMuted, textAlign: 'center', padding: 24 },
    txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
    txIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    txDesc: { ...FONTS.semiBold, fontSize: 13, color: COLORS.text },
    txMeta: { ...FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
    txAmount: { ...FONTS.bold, fontSize: 13 },
    txStatus: { ...FONTS.medium, fontSize: 10, marginTop: 2 },
});
