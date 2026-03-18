import React, { useEffect, useMemo, useRef, useState } from 'react';
import './SettingsPage.css';

const SETTINGS_STORAGE_KEY = 'milbantkar.userSettings.v1';
const SEEN_ALERTS_STORAGE_KEY = 'seenAlertIds';
const NOTIFICATION_PROMPT_SNOOZE_KEY = 'milbantkar.notificationPromptSnoozedAt';
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://milbantkar-1.onrender.com';
const API_FALLBACK = 'http://localhost:5000';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const defaultSettings = {
  theme: 'system',
  notificationsEnabled: true,
  notificationSound: true,
  reminderFrequency: 'daily',
  defaultCurrency: 'INR',
  dateFormat: 'dd-mm-yyyy',
  startOfWeek: 'monday',
  compactView: false,
  autoOpenRecentEvent: true,
  showEmailInGroups: false,
  shareUsageAnalytics: false,
};

function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [notificationStatus, setNotificationStatus] = useState('default');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const fileInputRef = useRef(null);

  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem('userId');
      if (!raw) return null;
      const t = raw.trim();
      if (t.startsWith('"') || t.startsWith('{') || t.startsWith('[')) {
        try {
          return JSON.parse(t);
        } catch {
          return raw;
        }
      }
      return raw;
    } catch {
      return null;
    }
  };

  const syncPushSubscription = async () => {
    if (typeof window === 'undefined') {
      throw new Error('This action requires a browser environment.');
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported in this browser.');
    }

    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User session not found. Please log in again.');
    }

    const registration = await navigator.serviceWorker.register('/push-sw.js');

    let keyRes;
    try {
      keyRes = await fetch(`${API_BASE}/api/push/public-key`);
      if (!keyRes.ok) throw new Error('Primary API failed');
    } catch {
      keyRes = await fetch(`${API_FALLBACK}/api/push/public-key`);
      if (!keyRes.ok) throw new Error('Unable to fetch push public key.');
    }

    const { publicKey } = await keyRes.json();
    if (!publicKey) {
      throw new Error('Push public key is missing.');
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const payload = JSON.stringify({ userId, subscription });

    try {
      const subRes = await fetch(`${API_BASE}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      if (!subRes.ok) throw new Error('Primary subscribe failed');
    } catch {
      const fallbackRes = await fetch(`${API_FALLBACK}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      if (!fallbackRes.ok) {
        throw new Error('Failed to sync notification subscription.');
      }
    }
  };

  const maybeShowPermissionPrompt = (permission) => {
    if (permission !== 'default') {
      setShowPermissionPrompt(false);
      return;
    }

    const snoozedAtRaw = localStorage.getItem(NOTIFICATION_PROMPT_SNOOZE_KEY);
    const snoozedAt = snoozedAtRaw ? Number(snoozedAtRaw) : 0;
    const oneDayMs = 24 * 60 * 60 * 1000;
    const shouldShow = !snoozedAt || Number.isNaN(snoozedAt) || (Date.now() - snoozedAt > oneDayMs);
    setShowPermissionPrompt(shouldShow);
  };

  const askLaterForNotifications = () => {
    localStorage.setItem(NOTIFICATION_PROMPT_SNOOZE_KEY, String(Date.now()));
    setShowPermissionPrompt(false);
    setSaveMessage('Okay, we will ask later for notification permission.');
    setSaveError('');
  };

  const refreshNotificationStatus = async () => {
    if (typeof Notification === 'undefined') {
      setSaveError('Browser notifications are not supported on this device.');
      return;
    }

    const permission = Notification.permission;
    setNotificationStatus(permission);

    if (permission === 'granted') {
      try {
        await syncPushSubscription();
        setField('notificationsEnabled', true);
        setSaveMessage('Notifications are enabled and subscription is synced.');
        setSaveError('');
      } catch (error) {
        setSaveError(error.message || 'Permission is granted but sync failed. Please retry.');
      }
    } else if (permission === 'default') {
      maybeShowPermissionPrompt(permission);
      setSaveMessage('Notification permission is not decided yet.');
      setSaveError('');
    } else {
      setField('notificationsEnabled', false);
      setSaveError('Notifications are blocked in browser settings for this site.');
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch {
      setSaveError('Could not load saved settings. Defaults were applied.');
    }

    if (typeof Notification !== 'undefined') {
      const permission = Notification.permission;
      setNotificationStatus(permission);
      maybeShowPermissionPrompt(permission);
    }
  }, []);

  const appliedTheme = useMemo(() => {
    if (settings.theme === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return settings.theme;
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-app-theme', appliedTheme);
  }, [appliedTheme]);

  const setField = (field, value) => {
    setSaveMessage('');
    setSaveError('');
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setSaveMessage('Settings saved successfully.');
      setSaveError('');
    } catch {
      setSaveError('Unable to save settings. Please try again.');
      setSaveMessage('');
    }
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
    setSaveMessage('Settings reset to defaults.');
    setSaveError('');
  };

  const clearSeenAlerts = () => {
    localStorage.removeItem(SEEN_ALERTS_STORAGE_KEY);
    setSaveMessage('Notification history was cleared.');
    setSaveError('');
  };

  const enableBrowserNotifications = async () => {
    if (typeof Notification === 'undefined') {
      setSaveError('Browser notifications are not supported on this device.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);

      if (permission === 'granted') {
        setField('notificationsEnabled', true);
        await syncPushSubscription();
        localStorage.removeItem(NOTIFICATION_PROMPT_SNOOZE_KEY);
        setShowPermissionPrompt(false);
        setSaveMessage('Browser notifications enabled and synced for background delivery.');
        setSaveError('');
      } else {
        setField('notificationsEnabled', false);
        if (permission === 'denied') {
          setShowPermissionPrompt(false);
          setSaveError('Notifications are blocked. Browser will not show the prompt again until you allow this site in browser settings.');
        } else {
          maybeShowPermissionPrompt(permission);
          setSaveError('Notifications were not enabled. Permission is required.');
        }
      }
    } catch (error) {
      setSaveError(error.message || 'Failed to request notification permission.');
    }
  };

  const sendTestNotification = () => {
    if (typeof Notification === 'undefined') {
      setSaveError('Browser notifications are not supported on this device.');
      return;
    }

    if (Notification.permission !== 'granted') {
      setSaveError('Enable browser notifications first to send a test alert.');
      return;
    }

    const notification = new Notification('MilBantKar Test Notification', {
      body: 'Your reminder and activity alerts are working.',
      icon: '/logo192.png',
      tag: 'milbantkar-settings-test'
    });

    setTimeout(() => notification.close(), 4500);
    setSaveMessage('Test notification sent.');
    setSaveError('');
  };

  const reSyncNotifications = async () => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      setSaveError('Please allow browser notifications first.');
      return;
    }

    try {
      await syncPushSubscription();
      setSaveMessage('Notification subscription synced successfully. You can now receive reminders when browser is closed.');
      setSaveError('');
    } catch (error) {
      setSaveError(error.message || 'Could not sync notification subscription.');
    }
  };

  const exportSettings = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'milbantkar-settings.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setSaveMessage('Settings exported.');
    setSaveError('');
  };

  const triggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const importSettings = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const nextSettings = { ...defaultSettings, ...(parsed.settings || parsed) };
      setSettings(nextSettings);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
      setSaveMessage('Settings imported successfully.');
      setSaveError('');
    } catch {
      setSaveError('Invalid settings file. Please import a valid JSON export.');
      setSaveMessage('');
    }
  };

  return (
    <div className="settings-page">
      {showPermissionPrompt ? (
        <div className="notification-permission-overlay" role="dialog" aria-modal="true" aria-labelledby="notification-prompt-title">
          <div className="notification-permission-modal">
            <h3 id="notification-prompt-title">Enable Notifications?</h3>
            <p>
              Get reminder alerts even when your MilBantKar tab is closed. You can allow now or ask us later.
            </p>
            <div className="button-row">
              <button type="button" onClick={enableBrowserNotifications}>Allow Notifications</button>
              <button type="button" className="secondary" onClick={askLaterForNotifications}>Ask Me Later</button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="settings-shell">
        <header className="settings-header">
          <p className="settings-kicker">Preferences</p>
          <h1>Settings</h1>
          <p>
            Personalize reminders, display behavior, privacy defaults, and notification options for your account.
          </p>
        </header>

        {saveMessage ? <div className="settings-banner success">{saveMessage}</div> : null}
        {saveError ? <div className="settings-banner error">{saveError}</div> : null}

        <section className="settings-card">
          <h2>Appearance</h2>
          <div className="settings-grid">
            <label>
              Theme
              <select value={settings.theme} onChange={(e) => setField('theme', e.target.value)}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>

            <label>
              Date format
              <select value={settings.dateFormat} onChange={(e) => setField('dateFormat', e.target.value)}>
                <option value="dd-mm-yyyy">DD-MM-YYYY</option>
                <option value="mm-dd-yyyy">MM-DD-YYYY</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD</option>
              </select>
            </label>

            <label>
              Start week on
              <select value={settings.startOfWeek} onChange={(e) => setField('startOfWeek', e.target.value)}>
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </label>

            <label className="switch-row">
              <span>Compact list layout</span>
              <input
                type="checkbox"
                checked={settings.compactView}
                onChange={(e) => setField('compactView', e.target.checked)}
              />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <h2>Notifications</h2>
          <p className="subtext">Browser status: <strong>{notificationStatus}</strong></p>

          {notificationStatus === 'denied' ? (
            <div className="notification-help denied">
              <p>
                Notifications are blocked for this site in browser settings.
              </p>
              <p>
                Open browser settings manually and allow notifications for this site, then click re-check below.
              </p>
              <div className="button-row">
                <button type="button" onClick={refreshNotificationStatus}>
                  I Enabled In Browser, Re-check
                </button>
                <button type="button" className="secondary" onClick={askLaterForNotifications}>Ask Me Later</button>
              </div>
            </div>
          ) : null}

          <div className="settings-grid">
            <label className="switch-row">
              <span>Enable in-app reminders</span>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => setField('notificationsEnabled', e.target.checked)}
              />
            </label>

            <label className="switch-row">
              <span>Play notification sound</span>
              <input
                type="checkbox"
                checked={settings.notificationSound}
                onChange={(e) => setField('notificationSound', e.target.checked)}
              />
            </label>

            <label>
              Reminder frequency
              <select
                value={settings.reminderFrequency}
                onChange={(e) => setField('reminderFrequency', e.target.value)}
              >
                <option value="never">Never</option>
                <option value="daily">Daily</option>
                <option value="every3days">Every 3 days</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>

            <div className="button-row">
              <button type="button" onClick={enableBrowserNotifications}>Enable Browser Notifications</button>
              <button type="button" className="secondary" onClick={sendTestNotification}>Send Test Notification</button>
              <button type="button" className="secondary" onClick={reSyncNotifications}>Sync Notification Subscription</button>
              <button type="button" className="secondary" onClick={refreshNotificationStatus}>Re-check Permission Status</button>
            </div>
          </div>

          <p className="subtext notification-note">
            Once allowed and synced, notifications can still arrive even when app tabs are closed.
          </p>
        </section>

        <section className="settings-card">
          <h2>Expense Preferences</h2>
          <div className="settings-grid">
            <label>
              Default currency
              <select
                value={settings.defaultCurrency}
                onChange={(e) => setField('defaultCurrency', e.target.value)}
              >
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </label>

            <label className="switch-row">
              <span>Open most recent event on login</span>
              <input
                type="checkbox"
                checked={settings.autoOpenRecentEvent}
                onChange={(e) => setField('autoOpenRecentEvent', e.target.checked)}
              />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <h2>Privacy</h2>
          <div className="settings-grid">
            <label className="switch-row">
              <span>Show my email in group views</span>
              <input
                type="checkbox"
                checked={settings.showEmailInGroups}
                onChange={(e) => setField('showEmailInGroups', e.target.checked)}
              />
            </label>

            <label className="switch-row">
              <span>Share anonymous usage analytics</span>
              <input
                type="checkbox"
                checked={settings.shareUsageAnalytics}
                onChange={(e) => setField('shareUsageAnalytics', e.target.checked)}
              />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <h2>Data Tools</h2>
          <div className="button-row">
            <button type="button" onClick={exportSettings}>Export settings</button>
            <button type="button" className="secondary" onClick={triggerImport}>Import settings</button>
            <button type="button" className="secondary danger" onClick={clearSeenAlerts}>Clear notification history</button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden-input"
              onChange={importSettings}
            />
          </div>
        </section>

        <footer className="settings-actions">
          <button type="button" className="secondary" onClick={resetToDefaults}>Reset to defaults</button>
          <button type="button" onClick={saveSettings}>Save changes</button>
        </footer>
      </div>
    </div>
  );
}

export default SettingsPage;
