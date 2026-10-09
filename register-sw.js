window.taskwellServiceWorkerReady = null;

if ('serviceWorker' in navigator) {
  window.taskwellServiceWorkerReady = navigator.serviceWorker.register('./sw.js')
    .then((registration) => {
      console.log('Service worker berhasil didaftarkan.');
      return navigator.serviceWorker.ready || registration;
    })
    .catch((error) => {
      console.error('Service worker gagal didaftarkan:', error);
      return null;
    });
}
