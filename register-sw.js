if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./sw.js');
      console.log('Service worker berhasil didaftarkan.');
    } catch (error) {
      console.error('Service worker gagal didaftarkan:', error);
    }
  });
}
