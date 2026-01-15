export function showNotification(text) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(text);
  }
}
