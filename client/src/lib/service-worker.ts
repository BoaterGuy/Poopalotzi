export function registerSW() {
  // Check if not Safari, as Safari has compatibility issues with service workers
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  if ('serviceWorker' in navigator && !isSafari) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.error('ServiceWorker registration failed: ', error);
        });
    });
  } else if (isSafari) {
    console.log('Service worker registration skipped for Safari browser');
  }
}

// Check if the app can be installed (PWA)
export function checkInstallability() {
  if ('BeforeInstallPromptEvent' in window) {
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;
    });

    return {
      isInstallable: !!deferredPrompt,
      showInstallPrompt: () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          
          deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the install prompt');
            } else {
              console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
          });
        }
      }
    };
  }
  
  return {
    isInstallable: false,
    showInstallPrompt: () => {}
  };
}
