import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl, Modal, StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getAccounts, getTransactions } from '../api/api';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../theme/theme';

const INITIAL_NOTIFICATIONS = [];

export default function OverviewScreen({ navigation }) {
    const { user } = useAuth();
    const { C } = useTheme();
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
    const [selectedTxn, setSelectedTxn] = useState(null);

    const styles = getStyles(C);

    const load = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [accs, txns] = await Promise.all([
                getAccounts({ userId: user.id }),
                getTransactions({ userId: user.id })
            ]);
            setAccounts(accs);
            setTransactions(txns);
        } catch (err) {
            console.error('Failed to load overview:', err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    useEffect(() => { load(); }, [load]);

    // Background poll every 15 seconds to pick up new transactions and notify
    useEffect(() => {
        if (!user?.id) return;
        const interval = setInterval(async () => {
            try {
                const txns = await getTransactions({ userId: user.id });
                if (txns.length > transactions.length) {
                    const newTxns = txns.filter(t => !transactions.find(p => p.id === t.id));
                    newTxns.forEach(t => {
                        setNotifications(n => [{
                            id: Date.now() + Math.random(),
                            icon: t.type === 'credit' ? '💰' : '💸',
                            title: t.type === 'credit' ? 'Money Received' : 'Money Sent',
                            message: `${t.description}: $${Math.abs(t.amount).toLocaleString()}`,
                            time: 'Just now',
                            unread: true,
                        }, ...n]);
                    });
                    setTransactions(txns);
                }
            } catch (err) {
                console.error('Failed to poll transactions:', err);
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [user?.id, transactions]);

    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
    const totalIncome = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = Math.abs(
        transactions
            .filter(t => t.type === 'debit' && t.category !== 'Internal Transfer')
            .reduce((s, t) => s + t.amount, 0)
    );
    const unread = notifications.filter(n => n.unread).length;
    const recentTxns = transactions.slice(0, 5);

    // Calculate latest month data for "Monthly Highlight"
    const getLatestMonthData = () => {
        if (transactions.length === 0) return { month: 'No Data', income: 0, expense: 0 };

        const dates = transactions.map(t => new Date(t.date));
        const latestDate = new Date(Math.max(...dates));
        const monthStr = latestDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        const monthTxns = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === latestDate.getMonth() && d.getFullYear() === latestDate.getFullYear();
        });

        const income = monthTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
        const expense = Math.abs(monthTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0));

        return { month: monthStr, income, expense };
    };

    const latestMonth = getLatestMonthData();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={styles.loadingText}>Loading your dashboard...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
        >
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            {/* Header */}
            <LinearGradient colors={[C.gradStart, C.gradEnd]} style={styles.header}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.greeting}>Good day,</Text>
                        <Text style={styles.userName}>{user?.name || 'User'} 👋</Text>
                    </View>
                    <TouchableOpacity style={styles.notifBtn} onPress={() => setShowNotifs(p => !p)} activeOpacity={0.8}>
                        <Text style={{ fontSize: 22 }}>🔔</Text>
                        {unread > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unread}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Total Net Worth</Text>
                    <Text style={styles.balanceAmount}>
                        ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.balanceRow}>
                        <View style={styles.balanceSub}>
                            <Text style={styles.balanceSubLabel}>Income</Text>
                            <Text style={[styles.balanceSubValue, { color: C.success }]}>+${totalIncome.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.balanceSub, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 20 }]}>
                            <Text style={styles.balanceSubLabel}>Expenses</Text>
                            <Text style={[styles.balanceSubValue, { color: '#FCA5A5' }]}>-${totalExpenses.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {/* Notification Panel */}
            {showNotifs && (
                <View style={styles.notifPanel}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    {notifications.map(n => (
                        <TouchableOpacity
                            key={n.id}
                            style={[styles.notifItem, !n.unread && { opacity: 0.6 }]}
                            onPress={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x))}
                        >
                            <Text style={{ fontSize: 24, marginRight: 12 }}>{n.icon}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.notifTitle}>{n.title}</Text>
                                <Text style={styles.notifMsg}>{n.message}</Text>
                                <Text style={styles.notifTime}>{n.time}</Text>
                            </View>
                            {n.unread && <View style={styles.unreadDot} />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Summary Strip */}
            <View style={styles.summaryStrip}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Active Accounts</Text>
                    <Text style={styles.summaryValue}>{accounts.length.toString()}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Transactions</Text>
                    <Text style={styles.summaryValue}>{transactions.length.toString()}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Net Savings</Text>
                    <Text style={[styles.summaryValue, { color: C.success }]}>{`$${(totalIncome - totalExpenses).toLocaleString()}`}</Text>
                </View>
            </View>



            {/* Recent Transactions */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Accounts')}>
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.card}>
                    {recentTxns.length === 0
                        ? <Text style={styles.emptyText}>No transactions yet</Text>
                        : recentTxns.map((t, i) => (
                            <TouchableOpacity 
                                key={t._id || i} 
                                style={[styles.txnRow, i < recentTxns.length - 1 && styles.txnRowBorder]}
                                onPress={() => setSelectedTxn(t)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.txnIcon, { backgroundColor: t.type === 'credit' ? '#D1FAE5' : '#FEE2E2' }]}>
                                    <Text style={{ fontSize: 16 }}>{t.type === 'credit' ? '📈' : '📉'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.txnDesc} numberOfLines={1}>{t.description}</Text>
                                    <Text style={styles.txnMeta}>{t.category} · {t.date}</Text>
                                </View>
                                <Text style={[styles.txnAmount, { color: t.type === 'credit' ? C.success : C.danger }]}>
                                    {t.type === 'credit' ? '+' : '-'}${Math.abs(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                            </TouchableOpacity>
                        ))
                    }
                </View>
            </View>

            {/* Month Highlights */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Monthly Highlight</Text>
                <View style={[styles.card, { backgroundColor: C.primary }]}>
                    <Text style={{ ...FONTS.semiBold, color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 4 }}>{latestMonth.month}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={{ ...FONTS.regular, color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Income</Text>
                            <Text style={{ ...FONTS.bold, color: '#6EE7B7', fontSize: 20 }}>+${latestMonth.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ ...FONTS.regular, color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Expenses</Text>
                            <Text style={{ ...FONTS.bold, color: '#FCA5A5', fontSize: 20 }}>-${latestMonth.expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        </View>
                    </View>
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
 
                        {(() => {
                            const desc = selectedTxn?.description;
                            if (!desc) return null;
                            let recipient = 'N/A';
                            const m1 = desc.match(/^Payment to ([^:]+)/);
                            if (m1) recipient = m1[1].trim();
                            const m2 = desc.match(/^Transfer to account (.+)/);
                            if (m2) recipient = m2[1].trim();
                            const m3 = desc.match(/^Transfer from (.+)/);
                            if (m3) recipient = m3[1].trim();
                            
                            if (recipient === 'N/A') return null;
                            
                            return (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Recipient/Sender</Text>
                                    <Text style={styles.detailValue}>{recipient}</Text>
                                </View>
                            );
                        })()}
                        
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
 
            <View style={{ height: 20 }} />
        </ScrollView>
    );
}

function getStyles(C) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: C.bg },
        loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
        loadingText: { ...FONTS.medium, color: C.textMuted, marginTop: 12 },
        header: { paddingTop: 56, paddingBottom: 30, paddingHorizontal: SPACING.lg },
        headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
        greeting: { ...FONTS.regular, color: 'rgba(255,255,255,0.75)', fontSize: 14 },
        userName: { ...FONTS.bold, color: '#fff', fontSize: 20 },
        notifBtn: { position: 'relative', padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md },
        badge: {
            position: 'absolute', top: 4, right: 4,
            backgroundColor: C.danger, borderRadius: 10,
            width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
        },
        badgeText: { ...FONTS.bold, color: '#fff', fontSize: 10 },
        balanceCard: {
            backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.lg,
            padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        },
        balanceLabel: { ...FONTS.medium, color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 4 },
        balanceAmount: { ...FONTS.extraBold, color: '#fff', fontSize: 34, marginBottom: 16 },
        balanceRow: { flexDirection: 'row', gap: 20 },
        balanceSub: {},
        balanceSubLabel: { ...FONTS.regular, color: 'rgba(255,255,255,0.65)', fontSize: 12 },
        balanceSubValue: { ...FONTS.bold, fontSize: 16 },
        notifPanel: { backgroundColor: C.card, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
        notifItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
        notifTitle: { ...FONTS.semiBold, fontSize: 13, color: C.text },
        notifMsg: { ...FONTS.regular, fontSize: 12, color: C.textMuted, marginTop: 1 },
        notifTime: { ...FONTS.regular, fontSize: 11, color: C.textLight, marginTop: 2 },
        unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, marginLeft: 8 },
        quickActionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingHorizontal: SPACING.md, marginTop: SPACING.lg, marginBottom: SPACING.sm },
        actionItem: { alignItems: 'center' },
        actionIconBg: { width: 56, height: 56, borderRadius: 14, backgroundColor: 'rgba(59, 130, 246, 0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.15)', marginBottom: 8 },
        actionText: { ...FONTS.medium, fontSize: 12, color: C.text },
        summaryStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.md, marginTop: SPACING.md },
        summaryCard: { width: '31%', backgroundColor: C.card, borderRadius: RADIUS.md, padding: 12, ...SHADOWS.sm, alignItems: 'center' },
        summaryLabel: { ...FONTS.regular, fontSize: 11, color: C.textMuted, textAlign: 'center', marginBottom: 4 },
        summaryValue: { ...FONTS.bold, fontSize: 16, color: C.text },
        section: { paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
        sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
        sectionTitle: { ...FONTS.semiBold, fontSize: 16, color: C.text, marginBottom: SPACING.sm },
        seeAll: { ...FONTS.medium, fontSize: 13, color: C.accent },
        card: { backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
        emptyText: { ...FONTS.regular, fontSize: 14, color: C.textMuted, textAlign: 'center', padding: 20 },
        txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
        txnRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
        txnIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
        txnDesc: { ...FONTS.semiBold, fontSize: 13, color: C.text },
        txnMeta: { ...FONTS.regular, fontSize: 11, color: C.textMuted, marginTop: 2 },
        txnAmount: { ...FONTS.bold, fontSize: 13 },
        quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
        quickAction: { alignItems: 'center', flex: 1 },
        quickActionIcon: { width: 56, height: 56, borderRadius: RADIUS.md, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm, marginBottom: 6 },
        quickActionLabel: { ...FONTS.medium, fontSize: 11, color: C.textMuted, textAlign: 'center' },
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
