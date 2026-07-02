import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { checkHealth } from '../api/api';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../theme/theme';
import { mockUsers } from '../utils/mockData';

const DEMO_EMAIL = 'testUser@gmail.com';
const DEMO_PASSWORD = 'password123';

export default function LoginScreen() {
    const { login } = useAuth();
    const { C } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const styles = getStyles(C);

    const validate = () => {
        const e = {};
        if (!email) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
        if (!password) e.password = 'Password is required';
        return e;
    };

    const handleLogin = async () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setIsLoading(true);
        
        // 1. Check if server is reachable
        const isServerUp = await checkHealth();
        if (!isServerUp) {
            setIsLoading(false);
            Alert.alert(
                'Connection Error',
                'Server is not reachable. Please try again later.'
            );
            return;
        }

        // 2. Simulate login delay
        await new Promise(r => setTimeout(r, 900));
        
        const matchedUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (matchedUser && password === DEMO_PASSWORD) {
            await login({ id: matchedUser.id, name: matchedUser.name, email: matchedUser.email, avatar: matchedUser.avatar });
        } else {
            Alert.alert('Login Failed', 'Invalid credentials.\nTry testUser@gmail.com or other mock emails with password123');
        }
        setIsLoading(false);
    };

    const fillDemo = () => {
        setEmail(DEMO_EMAIL);
        setPassword(DEMO_PASSWORD);
        setErrors({});
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <StatusBar barStyle="light-content" backgroundColor={C.primary} />
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <LinearGradient
                    colors={[C.gradStart, C.gradEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <View style={[styles.decor, { width: 180, height: 180, top: -50, right: -50, opacity: 0.1 }]} />
                    <View style={[styles.decor, { width: 120, height: 120, top: 40, left: -30, opacity: 0.08 }]} />
                    <View style={styles.brandRow}>
                        <View style={styles.brandIcon}>
                            <Text style={styles.brandIconText}>🏦</Text>
                        </View>
                        <Text style={styles.brandName}>DemoBank</Text>
                    </View>
                    <Text style={styles.heroTitle}>Secure. Smart.{'\n'}Modern Banking.</Text>
                    <Text style={styles.heroSub}>Your complete financial hub — manage accounts, track transactions, and transfer funds with confidence.</Text>
                    <View style={styles.features}>
                        {['256-bit SSL Encryption', 'Real-time Notifications', 'Multi-factor Auth'].map(f => (
                            <View key={f} style={styles.featureRow}>
                                <Text style={styles.featureIcon}>✅</Text>
                                <Text style={styles.featureText}>{f}</Text>
                            </View>
                        ))}
                    </View>
                </LinearGradient>

                {/* Form Panel */}
                <View style={styles.formPanel}>
                    <Text style={styles.formTitle}>Welcome Back</Text>
                    <Text style={styles.formSubtitle}>Sign in to your account</Text>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={[styles.input, errors.email && styles.inputError]}
                            placeholder="testUser@gmail.com"
                            placeholderTextColor={C.textLight}
                            value={email}
                            onChangeText={v => { setEmail(v); setErrors(p => ({ ...p, email: '' })); }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                        {errors.email ? <Text style={styles.errText}>{errors.email}</Text> : null}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.pwdRow}>
                            <TextInput
                                style={[styles.input, styles.inputPwd, errors.password && styles.inputError]}
                                placeholder="Enter your password"
                                placeholderTextColor={C.textLight}
                                value={password}
                                onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
                                secureTextEntry={!showPassword}
                                autoComplete="password"
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(p => !p)}>
                                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                            </TouchableOpacity>
                        </View>
                        {errors.password ? <Text style={styles.errText}>{errors.password}</Text> : null}
                    </View>

                    <TouchableOpacity
                        style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={[C.gradStart, C.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginBtnGrad}>
                            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Sign In</Text>}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.demoHint} onPress={fillDemo} activeOpacity={0.7}>
                        <Text style={styles.demoHintText}>🔑 Tap to fill demo credentials</Text>
                        <Text style={styles.demoHintSub}>testUser@gmail.com / password123</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function getStyles(C) {
    return StyleSheet.create({
        scroll: { flexGrow: 1, backgroundColor: C.bg },
        hero: { paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: 40, overflow: 'hidden' },
        decor: { position: 'absolute', borderRadius: RADIUS.full, backgroundColor: '#fff' },
        brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
        brandIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
        brandIconText: { fontSize: 22 },
        brandName: { ...FONTS.extraBold, fontSize: 24, color: '#fff' },
        heroTitle: { ...FONTS.extraBold, fontSize: 28, color: '#fff', lineHeight: 36, marginBottom: 10 },
        heroSub: { ...FONTS.regular, fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20, marginBottom: 20 },
        features: { gap: 8 },
        featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        featureIcon: { fontSize: 14 },
        featureText: { ...FONTS.medium, fontSize: 13, color: 'rgba(255,255,255,0.9)' },
        formPanel: {
            backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            marginTop: -20, padding: SPACING.lg, paddingBottom: 40, ...SHADOWS.lg,
        },
        formTitle: { ...FONTS.extraBold, fontSize: 22, color: C.text, marginBottom: 4 },
        formSubtitle: { ...FONTS.regular, fontSize: 14, color: C.textMuted, marginBottom: 24 },
        fieldGroup: { marginBottom: 16 },
        label: { ...FONTS.semiBold, fontSize: 13, color: C.text, marginBottom: 6 },
        input: {
            borderWidth: 1.5, borderColor: C.border, borderRadius: RADIUS.md,
            paddingHorizontal: 14, paddingVertical: 12,
            fontSize: 15, color: C.text, backgroundColor: C.bg,
        },
        inputError: { borderColor: C.danger },
        inputPwd: { flex: 1 },
        pwdRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        eyeBtn: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
        eyeIcon: { fontSize: 18 },
        errText: { ...FONTS.regular, fontSize: 12, color: C.danger, marginTop: 4 },
        loginBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: 8, marginBottom: 16 },
        loginBtnGrad: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
        loginBtnText: { ...FONTS.bold, fontSize: 16, color: '#fff' },
        demoHint: { backgroundColor: C.bg, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: C.border },
        demoHintText: { ...FONTS.semiBold, fontSize: 13, color: C.primary },
        demoHintSub: { ...FONTS.regular, fontSize: 12, color: C.textMuted, marginTop: 2 },
    });
}
