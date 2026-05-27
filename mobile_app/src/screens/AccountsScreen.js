import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl, Clipboard, Alert, Modal, Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAccounts, getTransactions } from '../api/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../theme/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 2 - SPACING.sm) / 2;

const ACCOUNT_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];



export default function AccountsScreen({ navigation }) {
    const { C } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTxn, setSelectedTxn] = useState(null);

    const styles = getStyles(C, insets);

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

    useFocusEffect(useCallback(() => { load(); }, [load]));
    useEffect(() => { load(); }, [load]);

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>
    );

    const nonCreditAccounts = accounts.filter(acc => acc.type !== 'credit');

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
        >
            <View style={styles.topBar}>
                <View>
                    <Text testID="txt_my_accounts" style={styles.pageTitle}>My Accounts</Text>
                    <Text testID="txt_manage_your_linked_accounts" style={styles.pageSub}>Manage your linked accounts</Text>
                </View>
                <TouchableOpacity testID="btn_nav_overview" style={styles.homeBtn} onPress={() => navigation.navigate('Overview')}>
                    <Text testID="txt_icon" style={{ fontSize: 20 }}>🏠</Text>
                </TouchableOpacity>
            </View>

            {/* Account Cards — 2-column grid */}
            <View style={styles.section}>
                <FlatList
                    data={nonCreditAccounts}
                    numColumns={2}
                    keyExtractor={(item) => item.id ?? item.number}
                    columnWrapperStyle={styles.gridRow}
                    scrollEnabled={false}
                    renderItem={({ item: acc, index }) => {
                        const color = acc.color || ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
                        const isNeg = acc.balance < 0;
                        const isLastOdd = index === nonCreditAccounts.length - 1 && nonCreditAccounts.length % 2 !== 0;
                        return (
                            <TouchableOpacity testID="btn_copytoclipboard" activeOpacity={0.8}
                                style={[styles.accountCard, { borderTopColor: color }, isLastOdd && { width: '100%' }]}
                                onPress={() => copyToClipboard(acc.number)}
                            >
                                <View style={[styles.accIconBadge, { backgroundColor: `${color}22` }]}>
                                    <Text testID="txt_icon" style={styles.accIconText}>💳</Text>
                                </View>
                                <Text testID={`txt_acc_name`} style={styles.accName} numberOfLines={1}>{acc.name}</Text>
                                <Text testID="txt_acc_type_charat_0_touppercase_" style={styles.accType}>{acc.type?.charAt(0).toUpperCase() + acc.type?.slice(1)}</Text>
                                <Text testID="txt_isneg_math_abs_acc_balance_tol" style={[styles.accBalance, { color: isNeg ? C.danger : C.success }]}>
                                    {isNeg ? '-' : ''}${Math.abs(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                                <Text testID="txt_acc_number_slice_4" style={styles.accNum} numberOfLines={1}>···· {acc.number?.slice(-4)} 📋</Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Summary Strip */}
            <View style={styles.summaryRow}>
                {[
                    { label: 'Total Accounts', value: accounts.length },
                    { label: 'Total Balance', value: `$${accounts.reduce((s, a) => s + a.balance, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                ].map(item => (
                    <View key={item.label} style={styles.summaryCard}>
                        <Text testID={`txt_item_label`} style={styles.summaryLabel}>{item.label}</Text>
                        <Text testID={`txt_item_value`} style={styles.summaryValue}>{item.value}</Text>
                    </View>
                ))}
            </View>

            {/* Recent Transactions */}
            <View style={styles.section}>
                <Text testID="txt_recent_transactions" style={styles.sectionTitle}>Recent Transactions</Text>
                <View style={styles.card}>
                    {transactions.length === 0
                        ? <Text testID="txt_no_transactions_found" style={styles.emptyText}>No transactions found</Text>
                        : transactions.slice(0, 20).map((t, i) => (
                            <TouchableOpacity testID="btn_setselectedtxn" key={t._id || i}
                                style={[styles.txRow, i < transactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}
                                onPress={() => setSelectedTxn(t)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.txIcon, { backgroundColor: t.type === 'credit' ? '#D1FAE5' : '#FEE2E2' }]}>
                                    <Text testID="txt_t_type_credit" style={{ fontSize: 14 }}>{t.type === 'credit' ? '📈' : '📉'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text testID={`txt_t_description`} style={styles.txDesc} numberOfLines={1}>{t.description}</Text>
                                    <Text testID="txt_t_category_t_date" style={styles.txMeta}>{t.category} · {t.date}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text testID="txt_t_type_credit_math_abs_t_amoun" style={[styles.txAmount, { color: t.type === 'credit' ? C.success : C.danger }]}>
                                        {t.type === 'credit' ? '+' : '-'}${Math.abs(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </Text>
                                    <Text testID={`txt_t_status`} style={[styles.txStatus, {
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
                        <Text testID="txt_transaction_details" style={styles.modalTitle}>Transaction Details</Text>
                        <View style={styles.detailRow}>
                            <Text testID="txt_description" style={styles.detailLabel}>Description</Text>
                            <Text testID="txt_selectedtxn_description" style={styles.detailValue}>{selectedTxn?.description}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text testID="txt_recipient" style={styles.detailLabel}>Recipient</Text>
                            <Text testID="txt_selectedtxn_description_starts" style={styles.detailValue}>
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
                            <Text testID="txt_amount" style={styles.detailLabel}>Amount</Text>
                            <Text testID="txt_selectedtxn_type_credit_math_a" style={[styles.detailValue, { color: selectedTxn?.type === 'credit' ? C.success : C.danger }]}>
                                {selectedTxn?.type === 'credit' ? '+' : '-'}${Math.abs(selectedTxn?.amount || 0).toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text testID="txt_date" style={styles.detailLabel}>Date</Text>
                            <Text testID="txt_selectedtxn_date" style={styles.detailValue}>{selectedTxn?.date}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text testID="txt_category" style={styles.detailLabel}>Category</Text>
                            <Text testID="txt_selectedtxn_category" style={styles.detailValue}>{selectedTxn?.category}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text testID="txt_status" style={styles.detailLabel}>Status</Text>
                            <Text testID="txt_selectedtxn_status_completed" style={[styles.detailValue, { color: C.success }]}>{selectedTxn?.status || 'Completed'}</Text>
                        </View>
                        <TouchableOpacity testID="btn_setselectedtxn" style={[styles.modalCancel, { marginTop: 20, alignSelf: 'flex-end' }]} onPress={() => setSelectedTxn(null)}>
                            <Text testID="txt_close" style={styles.modalCancelText}>Close</Text>
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
        sectionTitle: { ...FONTS.semiBold, fontSize: 15, color: C.text, marginBottom: SPACING.sm },
        gridRow: { justifyContent: 'space-between', marginBottom: SPACING.sm },
        accountCard: {
            width: CARD_WIDTH,
            backgroundColor: C.card, borderRadius: RADIUS.lg, padding: 14,
            borderTopWidth: 3, ...SHADOWS.sm,
        },
        accIconBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
        accIconText: { fontSize: 18 },
        accName: { ...FONTS.semiBold, fontSize: 13, color: C.text, marginBottom: 2 },
        accType: { ...FONTS.regular, fontSize: 10, color: C.textMuted, marginBottom: 6, textTransform: 'capitalize' },
        accBalance: { ...FONTS.bold, fontSize: 14, marginBottom: 4 },
        accNum: { ...FONTS.regular, fontSize: 10, color: C.textMuted },
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
