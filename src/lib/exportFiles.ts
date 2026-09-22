import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export { sanitizeFilenamePart } from './filenames';

function writeCacheFile(filename: string, content: string): File {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  return file;
}

// expo-file-system's File/Paths API isn't functional on web (this Expo SDK
// build errors before it even reaches disk), and there's no native share
// sheet there either -- so on web, trigger an ordinary browser download
// instead of going through expo-file-system + expo-sharing at all.
function downloadInBrowser(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function shareCsv(filename: string, csvContent: string): Promise<void> {
  if (Platform.OS === 'web') {
    downloadInBrowser(filename, csvContent, 'text/csv');
    return;
  }
  const file = writeCacheFile(filename, csvContent);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: filename,
      UTI: 'public.comma-separated-values-text',
    });
  }
}

export async function sharePdfFromHtml(html: string, dialogTitle: string): Promise<void> {
  const result = await Print.printToFileAsync({ html, base64: false });
  // expo-print's web implementation just triggers the browser's native
  // print dialog (where "Save as PDF" is available) and returns no file --
  // there's nothing left to share in that case.
  if (!result?.uri) return;
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle, UTI: 'com.adobe.pdf' });
  }
}
