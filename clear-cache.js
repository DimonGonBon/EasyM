// Скрипт для очистки кэша и перерегистрации service worker
// Добавить в консоль браузера если возникают проблемы

(async () => {
  try {
    // Очищаем все кэши
    const cacheNames = await caches.keys();
    console.log('Найденные кэши:', cacheNames);
    
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log(`Удалён кэш: ${cacheName}`);
    }
    
    // Отписываемся от service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Service Worker отписан');
      }
    }
    
    console.log('✓ Кэш полностью очищен. Перезагрузите страницу.');
  } catch (err) {
    console.error('Ошибка при очистке:', err);
  }
})();
