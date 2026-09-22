import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/hooks/useAuth';
import { colors, radius, shadow, spacing, type } from '../src/lib/theme';

export default function SignIn() {
  const { session, signIn, enterDemoMode, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  const handleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (signInError) setError(signInError);
  };

  const handleResetPassword = async () => {
    setError(null);
    setResetSubmitting(true);
    const { error: resetError } = await resetPassword(email.trim());
    setResetSubmitting(false);
    if (resetError) {
      setError(resetError);
    } else {
      setResetSent(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}>
          <Ionicons name="speedometer" size={30} color={colors.white} />
        </View>
        <Text style={styles.title}>Mileage &amp; Tax Tracker</Text>
        <Text style={styles.subtitle}>
          See which of your businesses is actually working — your data, never locked behind a
          subscription.
        </Text>

        <View style={styles.form}>
          {forgotMode ? (
            <>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={colors.textFaint} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textFaint}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  editable={!resetSent}
                />
              </View>

              {resetSent ? (
                <View style={styles.resetSentBox}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.resetSentText}>
                    If an account exists for that email, a reset link is on its way.
                  </Text>
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              {resetSent ? null : (
                <Pressable
                  style={[styles.button, (resetSubmitting || !email) && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={resetSubmitting || !email}
                >
                  {resetSubmitting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>Send Reset Link</Text>
                  )}
                </Pressable>
              )}

              <Pressable
                style={styles.forgotLink}
                onPress={() => {
                  setForgotMode(false);
                  setResetSent(false);
                  setError(null);
                }}
              >
                <Text style={styles.forgotLinkText}>Back to sign in</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={colors.textFaint} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textFaint}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textFaint} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.textFaint}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <Pressable
                style={styles.forgotLink}
                onPress={() => {
                  setForgotMode(true);
                  setError(null);
                }}
              >
                <Text style={styles.forgotLinkText}>Forgot password?</Text>
              </Pressable>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.button, (submitting || !email || !password) && styles.buttonDisabled]}
                onPress={handleSignIn}
                disabled={submitting || !email || !password}
              >
                {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Sign In</Text>}
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable style={styles.demoButton} onPress={enterDemoMode}>
                <Ionicons name="play-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.demoButtonText}>Try Demo</Text>
              </Pressable>
              <Text style={styles.demoHint}>
                Explore the app with sample data — no account needed. Nothing you do in demo mode is
                saved.
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  brandMark: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow,
  },
  title: {
    ...type.display,
    fontSize: 25,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...type.body,
    fontSize: 14.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.ink,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  error: {
    flex: 1,
    color: colors.danger,
    fontSize: 13.5,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotLinkText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  resetSentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successMuted,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  resetSentText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 13.5,
    lineHeight: 18,
  },
  button: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.textFaint,
    fontSize: 12.5,
    fontWeight: '600',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  demoButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  demoHint: {
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
});
