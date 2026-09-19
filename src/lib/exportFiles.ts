import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

function writeCacheFile(filename: string, content: string): File {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  return file;
}

export async function shareCsv(filename: string, csvContent: string): Promise<void> {
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
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle, UTI: 'com.adobe.pdf' });
  }
}
