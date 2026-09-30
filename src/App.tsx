/**
 * OneBot by HyperSoft
 * Official Multi-Guild Management Dashboard
 * 
 * Production State Machine:
 * LOADING -> UNAUTHENTICATED | SERVER_SELECT | AUTHENTICATED | FORBIDDEN | NOT_FOUND | ERROR
 */

import React, { useState, useEffect } from 'react';
import { multiGuildManager } from './services/multiGuildManager';
import { 
  GuildSettings, 
  GuildSummary, 
  DiscordUser, 
  GuildCapabilities, 
  GuildResources 
} from './types/guild';
import { Header } from './components/Header';
import { Sidebar, TabId } from './components/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { ServerSelectionView } from './components/auth/ServerSelectionView';
import { ErrorView } from './components/auth/ErrorView';

import { OverviewTab } from './components/tabs/OverviewTab';
import { ProtectionTab } from './components/tabs/ProtectionTab';
import { ModerationTab } from './components/tabs/ModerationTab';
import { TicketsTab } from './components/tabs/TicketsTab';
import { AutoResponderTab } from './components/tabs/AutoResponderTab';
import { RolesTab } from './components/tabs/RolesTab';
import { WelcomeTab } from './components/tabs/WelcomeTab';
import { LevelsTab } from './components/tabs/LevelsTab';
import { EmbedsTab } from './components/tabs/EmbedsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { IsolationInspectorTab } from './components/tabs/IsolationInspectorTab';
import { BOT_CONFIG } from './config/botConfig';
import { CheckCircle2, RotateCw } from 'lucide-react';

type AuthStatus = 
  | 'LOADING' 
  | 'UNAUTHENTICATED' 
  | 'SERVER_SELECT' 
  | 'AUTHENTICATED' 
  | 'FORBIDDEN' 
  | 'NOT_FOUND' 
  | 'ERROR';

export default function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('LOADING');
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [guildList, setGuildList] = useState<GuildSummary[]>([]);
  const [activeGuildId, setActiveGuildId] = useState<string>('');
  const [capabilities, setCapabilities] = useState<GuildCapabilities | null>(null);
  const [resources, setResources] = useState<GuildResources | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [settings, setSettings] = useState<GuildSettings | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Initial Authentication & Guild Discovery
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setAuthStatus('LOADING');
    try {
      const currentUser = await multiGuildManager.fetchCurrentUser();
      if (!currentUser) {
        setAuthStatus('UNAUTHENTICATED');
        return;
      }

      setUser(currentUser);
      await loadUserGuilds(currentUser);
    } catch (err: any) {
      console.error('[App Init Error]:', err);
      setAuthStatus('UNAUTHENTICATED');
    }
  };

  const loadUserGuilds = async (currentUser: DiscordUser) => {
    setIsRefreshing(true);
    try {
      const guilds = await multiGuildManager.fetchUserGuilds();
      setGuildList(guilds);

      const activeGuilds = guilds.filter(g => g.botInstalled && g.canManage);

      if (activeGuilds.length === 0) {
        // User is logged in, but has no guilds with OneBot installed yet
        setAuthStatus('SERVER_SELECT');
        setIsRefreshing(false);
        return;
      }

      // Restore last active guild or select the first available active guild
      const savedLastId = multiGuildManager.getLastActiveGuildId();
      const targetGuildId = activeGuilds.find(g => g.guildId === savedLastId)?.guildId || activeGuilds[0].guildId;

      await selectAndLoadGuild(targetGuildId);
    } catch (err: any) {
      console.error('[loadUserGuilds Error]:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء تحميل السيرفرات.');
      setAuthStatus('ERROR');
    } finally {
      setIsRefreshing(false);
    }
  };

  const selectAndLoadGuild = async (guildId: string) => {
    if (!guildId) return;
    setAuthStatus('LOADING');
    try {
      setActiveGuildId(guildId);

      // Fetch capabilities, resources, and settings in parallel
      const [caps, res, guildSettings] = await Promise.all([
        multiGuildManager.fetchGuildCapabilities(guildId),
        multiGuildManager.fetchGuildResources(guildId),
        multiGuildManager.fetchGuildSettingsAsync(guildId)
      ]);

      setCapabilities(caps);
      setResources(res);
      setSettings(guildSettings);
      setHasUnsavedChanges(false);
      setAuthStatus('AUTHENTICATED');
    } catch (err: any) {
      console.error(`[selectAndLoadGuild Error for ${guildId}]:`, err.message);
      if (err.message && err.message.includes('رفض الوصول')) {
        setErrorMessage(err.message);
        setAuthStatus('FORBIDDEN');
      } else if (err.message && err.message.includes('OneBot ليس عضواً')) {
        setErrorMessage(err.message);
        setAuthStatus('NOT_FOUND');
      } else {
        setErrorMessage(err.message || 'فشل جلب بيانات السيرفر.');
        setAuthStatus('ERROR');
      }
    }
  };

  const handleSelectGuild = (newGuildId: string) => {
    if (newGuildId === activeGuildId) return;

    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm("لديك تعديلات غير محفوظة على هذا السيرفر. هل تريد الانتقال وحفظ التغييرات أولاً؟");
      if (confirmSwitch) {
        handleSaveSettings();
      }
    }

    selectAndLoadGuild(newGuildId);
  };

  const handleUpdateSettings = (partial: Partial<GuildSettings>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      ...partial
    });
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    if (!settings || !activeGuildId) return;

    try {
      const saved = await multiGuildManager.saveGuildSettingsAsync(activeGuildId, settings);
      setSettings(saved);
      setHasUnsavedChanges(false);
      showToast(`تم حفظ جميع إعدادات سيرفر "${saved.guildName}" بنجاح!`);
    } catch (err: any) {
      alert(`فشل الحفظ: ${err.message || 'حدث خطأ في الاتصال بالسيرفر'}`);
    }
  };

  const handleLogout = async () => {
    await multiGuildManager.logout();
    setUser(null);
    setGuildList([]);
    setSettings(null);
    setAuthStatus('UNAUTHENTICATED');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 1. Loading View
  if (authStatus === 'LOADING') {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#E53935]/20 border border-[#E53935] p-2 flex items-center justify-center animate-pulse">
            <img src={BOT_CONFIG.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs text-gray-400 font-mono flex items-center gap-2">
            <RotateCw className="w-3.5 h-3.5 animate-spin text-[#E53935]" />
            جاري التحقق من هوية ديسكورد والمصادقة...
          </span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Login Gate
  if (authStatus === 'UNAUTHENTICATED') {
    return <LoginView />;
  }

  // 3. Server Selection View ("My Servers" & "Add OneBot")
  if (authStatus === 'SERVER_SELECT' && user) {
    return (
      <ServerSelectionView
        user={user}
        guilds={guildList}
        onSelectGuild={(id) => selectAndLoadGuild(id)}
        onRefreshGuilds={() => loadUserGuilds(user)}
        onLogout={handleLogout}
        isRefreshing={isRefreshing}
      />
    );
  }

  // 4. Forbidden View (403)
  if (authStatus === 'FORBIDDEN') {
    return (
      <ErrorView 
        code={403} 
        message={errorMessage} 
        onBackToServers={() => setAuthStatus('SERVER_SELECT')} 
      />
    );
  }

  // 5. Not Found View (404)
  if (authStatus === 'NOT_FOUND') {
    return (
      <ErrorView 
        code={404} 
        message={errorMessage} 
        onBackToServers={() => setAuthStatus('SERVER_SELECT')} 
      />
    );
  }

  // 6. Generic Error View (500)
  if (authStatus === 'ERROR') {
    return (
      <ErrorView 
        code={500} 
        message={errorMessage} 
        onRetry={initApp} 
        onBackToServers={() => setAuthStatus('SERVER_SELECT')} 
      />
    );
  }

  const currentSummary = guildList.find(g => g.guildId === activeGuildId);

  // 7. Authenticated Dashboard View
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6] flex flex-col selection:bg-[#E53935] selection:text-white pb-16 lg:pb-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#16161D] border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentGuildSummary={currentSummary}
        guildList={guildList}
        user={user}
        onSelectGuild={handleSelectGuild}
        onOpenServerSelector={() => setAuthStatus('SERVER_SELECT')}
        onLogout={handleLogout}
        hasUnsavedChanges={hasUnsavedChanges}
        onSaveCurrentSettings={handleSaveSettings}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          guildName={settings?.guildName || "Discord Guild"}
          capabilities={capabilities}
        />

        {/* Content Tabs */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {activeTab === 'overview' && settings && (
            <OverviewTab
              settings={settings}
              onUpdate={handleUpdateSettings}
              onSwitchTab={(t) => setActiveTab(t)}
            />
          )}

          {activeTab === 'protection' && settings && (
            <ProtectionTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'moderation' && settings && (
            <ModerationTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'tickets' && settings && (
            <TicketsTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'autoresponder' && settings && (
            <AutoResponderTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'roles' && settings && (
            <RolesTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'welcome' && settings && (
            <WelcomeTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'levels' && settings && (
            <LevelsTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'embeds' && settings && (
            <EmbedsTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'settings' && settings && (
            <SettingsTab
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          )}

          {activeTab === 'inspector' && settings && (
            <IsolationInspectorTab 
              currentSettings={settings}
              guildList={guildList}
            />
          )}
        </main>
      </div>
    </div>
  );
}
