import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
    Alert, ActivityIndicator, Switch
} from 'react-native';
import { getUserProfile, updateUserProfile } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen({ navigation }) {
    const { user, login, logout } = useAuth();
    const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: '', address: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [biometrics, setBiometrics] = useState(false);

    useEffect(() => {
        getUserProfile('user-1')
            .then(data => setProfile({ name: data.name, email: data.email, phone: data.phone || '', address: data.address || '' }))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await updateUserProfile('user-1', profile);
            await login({ ...user, name: updated.name, email: updated.email });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            Alert.alert('Error', 'Failed to save profile: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
    );

    const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'TU';

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.pageTitle}>Settings</Text>
                    <Text style={styles.pageSub}>Manage your profile and preferences</Text>
                </View>
                <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Overview')}>
                    <Text style={{ fontSize: 20 }}>🏠</Text>
                </TouchableOpacity>
            </View>

            {/* Profile Header */}
            <LinearGradient colors={[COLORS.gradStart, COLORS.gradEnd]} style={styles.profileHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={styles.profileEmail}>{profile.email}</Text>
                    <View style={styles.premiumBadge}>
                        <Text style={styles.premiumBadgeText}>✨ Premium Account</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Profile Form */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Profile Information</Text>
                {saved && (
                    <View style={styles.successBanner}>
                        <Text style={styles.successText}>✅ Profile saved successfully!</Text>
                    </View>
                )}
                {[
                    { key: 'name', label: '👤 Full Name', placeholder: 'Your name', keyboardType: 'default' },
                    { key: 'email', label: '✉️ Email Address', placeholder: 'email@example.com', keyboardType: 'email-address' },
                    { key: 'phone', label: '📱 Phone Number', placeholder: '+1 234 567 8900', keyboardType: 'phone-pad' },
                    { key: 'address', label: '📍 Address', placeholder: '123 Main St, City', keyboardType: 'default' },
                ].map(field => (
                    <View key={field.key} style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>{field.label}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={field.placeholder}
                            placeholderTextColor={COLORS.textLight}
                            value={profile[field.key]}
                            onChangeText={v => setProfile(p => ({ ...p, [field.key]: v }))}
                            keyboardType={field.keyboardType}
                            autoCapitalize="none"
                        />
                    </View>
                ))}
                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.85}
                >
                    <LinearGradient colors={[COLORS.gradStart, COLORS.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnInner}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Preferences */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Preferences</Text>
                {[
                    { label: '🌙 Dark Mode', sub: 'Switch to dark theme', value: darkMode, setter: setDarkMode },
                    { label: '🔔 Push Notifications', sub: 'Receive transaction alerts', value: notifications, setter: setNotifications },
                    { label: '👆 Biometric Login', sub: 'Use fingerprint / Face ID', value: biometrics, setter: setBiometrics },
                ].map(pref => (
                    <View key={pref.label} style={styles.prefRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.prefLabel}>{pref.label}</Text>
                            <Text style={styles.prefSub}>{pref.sub}</Text>
                        </View>
                        <Switch
                            value={pref.value}
                            onValueChange={pref.setter}
                            trackColor={{ true: COLORS.primary, false: COLORS.border }}
                            thumbColor="#fff"
                        />
                    </View>
                ))}
            </View>

            {/* Security */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Security</Text>
                {[
                    { icon: '🔑', label: 'Change Password', desc: 'Update your account password' },
                    { icon: '🛡️', label: '2-Factor Authentication', desc: 'Add extra security to your account' },
                    { icon: '📱', label: 'Trusted Devices', desc: 'Manage your trusted devices' },
                ].map(item => (
                    <TouchableOpacity
                        key={item.label}
                        style={styles.secRow}
                        onPress={() => Alert.alert(item.label, 'This feature is coming soon!')}
                        activeOpacity={0.7}
                    >
                        <Text style={{ fontSize: 22, marginRight: 14 }}>{item.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.secLabel}>{item.label}</Text>
                            <Text style={styles.secDesc}>{item.desc}</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                <Text style={styles.logoutText}>🚪 Sign Out</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>DemoBank Mobile v1.0.0</Text>
            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    profileHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    avatarText: { ...FONTS.extraBold, fontSize: 22, color: '#fff' },
    profileName: { ...FONTS.bold, fontSize: 18, color: '#fff' },
    profileEmail: { ...FONTS.regular, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    premiumBadge: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 6 },
    premiumBadgeText: { ...FONTS.medium, fontSize: 11, color: '#fff' },
    card: { backgroundColor: COLORS.card, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
    cardTitle: { ...FONTS.bold, fontSize: 15, color: COLORS.text, marginBottom: 14 },
    successBanner: { backgroundColor: '#D1FAE5', borderRadius: RADIUS.md, padding: 12, marginBottom: 12 },
    successText: { ...FONTS.medium, fontSize: 13, color: '#065F46' },
    fieldGroup: { marginBottom: 14 },
    fieldLabel: { ...FONTS.semiBold, fontSize: 13, color: COLORS.text, marginBottom: 6 },
    input: {
        borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: COLORS.text, backgroundColor: '#F8FAFC',
    },
    saveBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: 6 },
    saveBtnInner: { paddingVertical: 14, alignItems: 'center' },
    saveBtnText: { ...FONTS.bold, fontSize: 15, color: '#fff' },
    prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    prefLabel: { ...FONTS.semiBold, fontSize: 14, color: COLORS.text },
    prefSub: { ...FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
    secRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    secLabel: { ...FONTS.semiBold, fontSize: 14, color: COLORS.text },
    secDesc: { ...FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
    chevron: { ...FONTS.bold, fontSize: 22, color: COLORS.textLight },
    logoutBtn: { marginHorizontal: SPACING.md, marginTop: SPACING.lg, backgroundColor: '#FEE2E2', borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
    logoutText: { ...FONTS.bold, fontSize: 15, color: COLORS.danger },
    versionText: { ...FONTS.regular, textAlign: 'center', fontSize: 12, color: COLORS.textLight, marginTop: SPACING.md },
});
