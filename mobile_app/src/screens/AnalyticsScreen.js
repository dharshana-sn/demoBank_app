import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import { getTransactions } from '../api/api';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../theme/theme';

const CATEGORY_COLORS = {
    Salary: '#10B981', Deposits: '#3B82F6', Withdrawals: '#EF4444',
    Transfers: '#8B5CF6', Bills: '#F59E0B', Shopping: '#EC4899',
    Dining: '#14B8A6', Investments: '#3B82F6',
};

const MONTHLY_DATA = [
    { month: 'Feb 2026', income: 10338.25, expense: 5387.97 },
    { month: 'Jan 2026', income: 8520.00, expense: 4210.50 },
    { month: 'Dec 2025', income: 9100.00, expense: 6030.00 },
    { month: 'Nov 2025', income: 8200.00, expense: 3800.00 },
];

const { width } = Dimensions.get('window');

export default function AnalyticsScreen({ navigation }) {
    const { C } = useTheme();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const styles = getStyles(C);

    const load = async () => {
        try {
            const txns = await getTransactions();
            setTransactions(txns);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { load(); }, []);

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Analyzing your data...</Text>
        </View>
    );

    const totalIncome = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalExpense = Math.abs(transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0));
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0.0';

    const categories = Object.keys(CATEGORY_COLORS);
    const categoryTotals = categories.map(cat => {
        const matching = transactions.filter(t => t.category === cat);
        const total = matching.reduce((s, t) => s + Math.abs(t.amount), 0);
        return { cat, total, count: matching.length };
    }).sort((a, b) => b.total - a.total).filter(c => c.total > 0);
    const maxTotal = categoryTotals[0]?.total || 1;

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
        >
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.pageTitle}>Analytics</Text>
                    <Text style={styles.pageSub}>Visualise your spending & income trends</Text>
                </View>
                <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Overview')}>
                    <Text style={{ fontSize: 20 }}>🏠</Text>
                </TouchableOpacity>
            </View>

            {/* Summary Strip */}
            <View style={styles.summaryGrid}>
                {[
                    { label: 'Total Income', value: `$${totalIncome.toLocaleString()}`, color: C.success },
                    { label: 'Total Expenses', value: `-$${totalExpense.toLocaleString()}`, color: C.danger },
                    { label: 'Net Savings', value: `$${netSavings.toLocaleString()}`, color: C.primary },
                    { label: 'Savings Rate', value: `${savingsRate}%`, color: C.purple },
                ].map(item => (
                    <View key={item.label} style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>{item.label}</Text>
                        <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
                    </View>
                ))}
            </View>

            {/* Bar Chart: Spending by Category */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>📊 Spending by Category</Text>
                {categoryTotals.map(({ cat, total, count }) => (
                    <View key={cat} style={styles.barRow}>
                        <View style={styles.barMeta}>
                            <Text style={styles.barLabel}>{cat}</Text>
                            <Text style={styles.barCount}>{count} txns · ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        </View>
                        <View style={styles.barTrack}>
                            <View style={[styles.barFill, {
                                width: `${(total / maxTotal) * 100}%`,
                                backgroundColor: CATEGORY_COLORS[cat] || C.accent,
                            }]} />
                        </View>
                    </View>
                ))}
            </View>

            {/* Monthly Breakdown */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>📅 Monthly Breakdown</Text>
                {MONTHLY_DATA.map(({ month, income, expense }) => {
                    const net = income - expense;
                    return (
                        <View key={month} style={styles.monthRow}>
                            <Text style={styles.monthLabel}>{month}</Text>
                            <View style={styles.monthVals}>
                                <Text style={[styles.monthVal, { color: C.success }]}>+${income.toLocaleString()}</Text>
                                <Text style={[styles.monthVal, { color: C.danger }]}>-${expense.toLocaleString()}</Text>
                                <Text style={[styles.monthVal, { color: C.primary }]}>=${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Income vs Expenses bars */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>📈 Income vs Expenses</Text>
                {MONTHLY_DATA.map(({ month, income, expense }) => {
                    const maxVal = Math.max(...MONTHLY_DATA.map(m => m.income));
                    const incomeW = (income / maxVal) * (width - 80);
                    const expenseW = (expense / maxVal) * (width - 80);
                    return (
                        <View key={month} style={{ marginBottom: 16 }}>
                            <Text style={styles.barLabel}>{month}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <View style={[styles.miniBar, { width: incomeW, backgroundColor: C.success }]} />
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <View style={[styles.miniBar, { width: expenseW, backgroundColor: C.danger }]} />
                            </View>
                            <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
                                <Text style={{ ...FONTS.regular, fontSize: 11, color: C.success }}>● Income: ${income.toLocaleString()}</Text>
                                <Text style={{ ...FONTS.regular, fontSize: 11, color: C.danger }}>● Expenses: ${expense.toLocaleString()}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Transaction Breakdown */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>🔢 Transaction Breakdown</Text>
                <View style={styles.typeRow}>
                    <View style={[styles.typeCard, { backgroundColor: '#D1FAE5' }]}>
                        <Text style={styles.typeIcon}>💰</Text>
                        <Text style={[styles.typeCount, { color: C.success }]}>
                            {transactions.filter(t => t.type === 'credit').length}
                        </Text>
                        <Text style={styles.typeLabel}>Credits</Text>
                    </View>
                    <View style={[styles.typeCard, { backgroundColor: '#FEE2E2' }]}>
                        <Text style={styles.typeIcon}>💸</Text>
                        <Text style={[styles.typeCount, { color: C.danger }]}>
                            {transactions.filter(t => t.type === 'debit').length}
                        </Text>
                        <Text style={styles.typeLabel}>Debits</Text>
                    </View>
                    <View style={[styles.typeCard, { backgroundColor: '#EDE9FE' }]}>
                        <Text style={styles.typeIcon}>📋</Text>
                        <Text style={[styles.typeCount, { color: C.purple }]}>
                            {transactions.length}
                        </Text>
                        <Text style={styles.typeLabel}>Total</Text>
                    </View>
                </View>
            </View>

            <View style={{ height: 24 }} />
        </ScrollView>
    );
}

function getStyles(C) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: C.bg },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, gap: 12 },
        loadingText: { ...FONTS.medium, color: C.textMuted, marginTop: 8 },
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
        summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, padding: SPACING.md },
        summaryCard: { width: '47%', backgroundColor: C.card, borderRadius: RADIUS.md, padding: 14, ...SHADOWS.sm },
        summaryLabel: { ...FONTS.regular, fontSize: 11, color: C.textMuted, marginBottom: 4 },
        summaryValue: { ...FONTS.bold, fontSize: 18 },
        card: { backgroundColor: C.card, marginHorizontal: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
        cardTitle: { ...FONTS.bold, fontSize: 15, color: C.text, marginBottom: 16 },
        barRow: { marginBottom: 14 },
        barMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
        barLabel: { ...FONTS.semiBold, fontSize: 13, color: C.text },
        barCount: { ...FONTS.regular, fontSize: 11, color: C.textMuted },
        barTrack: { height: 10, backgroundColor: C.border, borderRadius: 5, overflow: 'hidden' },
        barFill: { height: '100%', borderRadius: 5 },
        monthRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
        monthLabel: { ...FONTS.semiBold, fontSize: 13, color: C.text, marginBottom: 6 },
        monthVals: { flexDirection: 'row', gap: 12 },
        monthVal: { ...FONTS.bold, fontSize: 13 },
        miniBar: { height: 8, borderRadius: 4 },
        typeRow: { flexDirection: 'row', gap: 12 },
        typeCard: { flex: 1, borderRadius: RADIUS.md, padding: 14, alignItems: 'center' },
        typeIcon: { fontSize: 24, marginBottom: 6 },
        typeCount: { ...FONTS.extraBold, fontSize: 24 },
        typeLabel: { ...FONTS.medium, fontSize: 12, color: C.textMuted, marginTop: 2 },
    });
}
