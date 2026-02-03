# Исправление ERR_FAILED в Chrome/Opera GX на CloudFlare Pages

## Проблема
На Firefox приложение работает, но в Chrome и Opera GX выдаёт ошибку `ERR_FAILED` при попытке доступа к сайту.

## Причина
1. Service Worker кэширует ошибки установки (попытка кэшировать корневой путь `/`)
2. Chrome более строго проверяет service worker, чем Firefox
3. CloudFlare кэширует 404-ответы, что ломает всё приложение

## Решение

### 1. **Очистить кэш в Chrome/Opera GX**
```
1. Откроешь DevTools (F12)
2. Перейдёшь на вкладку "Application" → "Storage"
3. Нажмёшь кнопку "Clear site data"
4. Перезагрузишь страницу (Ctrl+F5)
```

Или используешь скрипт в консоли браузера:
```javascript
// Скопируй и выполни в консоли браузера:
(async () => {
  const cacheNames = await caches.keys();
  for (const cacheName of cacheNames) {
    await caches.delete(cacheName);
  }
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
  location.reload();
})();
```

### 2. **Очистить кэш CloudFlare**
Если очистка браузера не помогла:
1. Зайди на https://dash.cloudflare.com
2. Выбери домен (easymanual.pages.dev)
3. Перейди на вкладку "Caching"
4. Нажми "Purge Cache" → "Purge All"
5. Подожди 30 секунд и перезагрузи страницу

### 3. **Что было исправлено на сервере**
- ✅ Удалён корневой путь `/` из кэша (он вызывал ошибки)
- ✅ Добавлена обработка ошибок при кэшировании (теперь одна ошибка не ломает весь service worker)
- ✅ Добавлены правильные headers для CloudFlare (`_headers`)
- ✅ Добавлена переадресация для SPA (`_redirects`)

## После этого должно работать везде:
✅ Firefox  
✅ Chrome  
✅ Opera GX  
✅ Safari (iOS 16+)

Если всё ещё не работает, дай мне знать!
