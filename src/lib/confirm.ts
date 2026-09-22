// react-native-web's Alert.alert is a documented no-op
// (node_modules/react-native-web/dist/exports/Alert/index.js just has
// `static alert() {}`) — every Alert.alert call in this app silently does
// nothing on web, including destructive confirmations like "Delete trip?".
// These wrappers use the browser's native confirm()/alert() on web and the
// real Alert.alert everywhere else, so confirm/delete flows actually work
// when the app is run via `npm run web`, not just in Expo Go.
import { Alert, Platform } from 'react-native';

export function confirmAsync(
  title: string,
  message?: string,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel'
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function notifyAsync(title: string, message?: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [{ text: 'OK', onPress: () => resolve() }]);
  });
}
