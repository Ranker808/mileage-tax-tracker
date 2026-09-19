import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useVentures } from '../hooks/useVentures';
import { VentureChipRow } from './VentureChipRow';
import { useAuth } from '../hooks/useAuth';
import { uploadReceiptPhoto, getReceiptSignedUrl, deleteReceiptPhoto } from '../lib/receipts';
import { todayIso } from '../lib/format';
import { colors } from '../lib/theme';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../types/database';
import type { ExpenseInput } from '../hooks/useExpenses';

export interface ExpenseFormValues {
  date: string;
  venture_id: string;
  amount: string;
  category: ExpenseCategory;
  notes: string;
  receipt_photo_url: string | null;
}

interface Props {
  initial?: Partial<ExpenseFormValues>;
  submitLabel: string;
  onSubmit: (values: ExpenseInput) => Promise<{ error: string | null }>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function ExpenseForm({ initial, submitLabel, onSubmit }: Props) {
  const { session } = useAuth();
  const { ventures } = useVentures();
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [ventureId, setVentureId] = useState(initial?.venture_id ?? '');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category ?? 'gas');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [receiptPath, setReceiptPath] = useState<string | null>(initial?.receipt_photo_url ?? null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const effectiveVentureId = ventureId || ventures[0]?.id || '';

  useEffect(() => {
    if (initial?.receipt_photo_url) {
      getReceiptSignedUrl(initial.receipt_photo_url).then(setReceiptPreviewUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickAndUploadPhoto = async (source: 'camera' | 'library') => {
    if (!session?.user.id) return;
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo permission was denied.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ['images'] });

    if (result.canceled || !result.assets?.[0]) return;

    setUploadingPhoto(true);
    setError(null);
    const previousPath = receiptPath;
    try {
      const path = await uploadReceiptPhoto(result.assets[0].uri, session.user.id);
      setReceiptPath(path);
      const signedUrl = await getReceiptSignedUrl(path);
      setReceiptPreviewUrl(signedUrl);
      if (previousPath && previousPath !== path) {
        await deleteReceiptPhoto(previousPath);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAttachPhoto = () => {
    Alert.alert('Attach Receipt', undefined, [
      { text: 'Take Photo', onPress: () => pickAndUploadPhoto('camera') },
      { text: 'Choose from Library', onPress: () => pickAndUploadPhoto('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!DATE_RE.test(date)) {
      setError('Date must be in YYYY-MM-DD format.');
      return;
    }
    if (!effectiveVentureId) {
      setError('Add a venture before logging expenses.');
      return;
    }
    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      setError('Enter a valid amount.');
      return;
    }

    setSubmitting(true);
    const { error: submitError } = await onSubmit({
      date,
      venture_id: effectiveVentureId,
      amount: Math.round(amountNum * 100) / 100,
      category,
      receipt_photo_url: receiptPath,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (submitError) setError(submitError);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Date</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />

      <Text style={styles.label}>Venture</Text>
      {ventures.length === 0 ? (
        <Text style={styles.hint}>No ventures yet — add one from the Ventures tab first.</Text>
      ) : (
        <VentureChipRow ventures={ventures} selectedId={effectiveVentureId} onSelect={setVentureId} />
      )}

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryRow}>
        {EXPENSE_CATEGORIES.map((c) => (
          <Pressable
            key={c}
            style={[styles.categoryChip, category === c && styles.categoryChipSelected]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.categoryChipText, category === c && styles.categoryChipTextSelected]}>
              {c[0].toUpperCase() + c.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Amount</Text>
      <TextInput style={styles.input} value={String(amount)} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Oil change, printer paper..." />

      <Text style={styles.label}>Receipt photo (optional)</Text>
      {receiptPreviewUrl ? (
        <Image source={{ uri: receiptPreviewUrl }} style={styles.preview} resizeMode="cover" />
      ) : receiptPath ? (
        <Text style={styles.hint}>Receipt attached.</Text>
      ) : null}
      <Pressable style={styles.attachButton} onPress={handleAttachPhoto} disabled={uploadingPhoto}>
        {uploadingPhoto ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.attachButtonText}>{receiptPath ? 'Replace Photo' : 'Attach Photo'}</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Saving…' : submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 48,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.card,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    color: colors.text,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: colors.border,
  },
  attachButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  attachButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    marginTop: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
