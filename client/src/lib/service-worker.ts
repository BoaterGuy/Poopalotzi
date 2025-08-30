export function registerSW() {
  // Check if not Safari, as Safari has compatibility issues with service workers
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('replit');
  
  if ('serviceWorker' in navigator && !isSafari) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
          
          // Force update immediately in development
          if (isDev) {
            registration.update();
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  console.log('New version available, refreshing...');
                  if (isDev) {
                    // Auto-refresh in development
                    window.location.reload();
                  } else {
                    // Show notification in production
                    showUpdateNotification();
        })
        .catch(error => {
          console.error('ServiceWorker registration failed: ', error);
  } else if (isSafari) {
    console.log('Service worker registration skipped for Safari browser');

function showUpdateNotification() {
  // Create a simple notification for new version
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #0B1F3A;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    max-width: 300px;
  `;
  
  notification.innerHTML = `
    <div style="margin-bottom: 8px;">
      <strong>New version available!</strong>
    </div>
    <div style="margin-bottom: 12px;">
      Click refresh to get the latest updates.
    </div>
    <button onclick="window.location.reload()" style="
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 8px;
    ">Refresh</button>
    <button onclick="this.parentElement.remove()" style="
      background: transparent;
      color: #9ca3af;
      border: 1px solid #4b5563;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    ">Later</button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
  }, 10000);

// Utility function to manually clear service worker cache
export function clearServiceWorkerCache(): Promise<boolean> {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    } else {
      resolve(false);

// Utility function to unregister service worker completely
export function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.getRegistrations().then(registrations => {
      const promises = registrations.map(registration => registration.unregister());
      return Promise.all(promises).then(() => true);
    }).catch(() => false);
  return Promise.resolve(false);

// Development helper - adds cache debugging panel
export function addCacheDebugPanel() {
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('replit');
  
  if (!isDev) return;
  
  // Create debug panel
  const debugPanel = document.createElement('div');
  debugPanel.id = 'cache-debug-panel';
  debugPanel.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: #1f2937;
    color: white;
    padding: 12px;
    border-radius: 8px;
    font-size: 12px;
    font-family: monospace;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
  `;
  
  debugPanel.innerHTML = `
    <div style="margin-bottom: 8px; font-weight: bold;">Cache Debug Panel</div>
    <button id="clear-cache-btn" style="
      background: #ef4444;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 8px;
      font-size: 10px;
    ">Clear Cache</button>
    <button id="unregister-sw-btn" style="
      background: #f59e0b;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 8px;
      font-size: 10px;
    ">Unregister SW</button>
    <button id="reload-btn" style="
      background: #10b981;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 10px;
    ">Hard Reload</button>
    <div id="debug-status" style="margin-top: 8px; font-size: 10px; color: #9ca3af;"></div>
  `;
  
  document.body.appendChild(debugPanel);
  
  // Add event listeners
  document.getElementById('clear-cache-btn')?.addEventListener('click', async () => {
    const statusEl = document.getElementById('debug-status');
    if (statusEl) statusEl.textContent = 'Clearing cache...';
    
    const success = await clearServiceWorkerCache();
    if (statusEl) statusEl.textContent = success ? 'Cache cleared!' : 'Failed to clear cache';
    
    setTimeout(() => {
      if (statusEl) statusEl.textContent = '';
    }, 2000);
  
  document.getElementById('unregister-sw-btn')?.addEventListener('click', async () => {
    const statusEl = document.getElementById('debug-status');
    if (statusEl) statusEl.textContent = 'Unregistering SW...';
    
    const success = await unregisterServiceWorker();
    if (statusEl) statusEl.textContent = success ? 'SW unregistered!' : 'Failed to unregister SW';
    
    setTimeout(() => {
      if (statusEl) statusEl.textContent = '';
    }, 2000);
  
  document.getElementById('reload-btn')?.addEventListener('click', () => {
    window.location.reload();
  
  // Auto-hide after 30 seconds
  setTimeout(() => {
    if (debugPanel.parentElement) {
      debugPanel.remove();
  }, 30000);

// Check if the app can be installed (PWA)
export function checkInstallability() {
  if ('BeforeInstallPromptEvent' in window) {
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;

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
            deferredPrompt = null;
    };
  
  return {
    isInstallable: false,
    showInstallPrompt: () => {}
  };
