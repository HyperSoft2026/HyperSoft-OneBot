import React from 'react';
import { BOT_CONFIG } from '../../config/botConfig';
import { Shield, Sparkles, Ticket, Gavel, ArrowLeft } from 'lucide-react';

export const LoginView: React.FC = () => {
  const handleDiscordLogin = () => {
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6] flex flex-col justify-between selection:bg-[#E53935] selection:text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E53935]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="px-6 py-6 max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E53935] to-[#800F11] p-[2px] shadow-lg shadow-[#E53935]/25">
            <img 
              src={BOT_CONFIG.logoUrl} 
              alt="OneBot Logo" 
              className="w-full h-full object-cover rounded-[10px] bg-black" 
            />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">{BOT_CONFIG.name}</span>
            <span className="text-[10px] text-gray-400 block font-mono">بواسطة {BOT_CONFIG.developer}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono text-gray-400">Cluster 0.0.0.0:20360</span>
        </div>
      </header>

      {/* Main Hero Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10">
        <div className="max-w-md w-full bg-[#121216]/90 border border-[#22222B] rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center">
          
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#5C0A0C] p-[3px] shadow-2xl shadow-[#E53935]/40 mb-6 group hover:scale-105 transition-transform">
            <img 
              src={BOT_CONFIG.logoUrl} 
              alt="OneBot Logo" 
              className="w-full h-full object-cover rounded-[13px] bg-black"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            لوحة تحكم <span className="text-[#E53935]">OneBot</span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-400 mb-8 leading-relaxed max-w-sm">
            إدارة سيرفرات ديسكورد بمستوى احترافي. حماية متقدمة، نظام تذاكر متطور، محكمة إشرافية، وأتمتة كاملة.
          </p>

          {/* Login Button */}
          <button
            onClick={handleDiscordLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.99] text-white font-bold text-sm sm:text-base py-3.5 px-6 rounded-2xl shadow-xl shadow-[#5865F2]/25 transition-all group cursor-pointer mb-6"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span>تسجيل الدخول عبر Discord</span>
            <ArrowLeft className="w-4 h-4 mr-auto group-hover:-translate-x-1 transition-transform" />
          </button>

          {/* Feature Highlights */}
          <div className="w-full grid grid-cols-2 gap-2 text-right">
            <div className="p-3 bg-[#181820]/70 border border-[#262633] rounded-xl flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-[#E53935] shrink-0" />
              <span className="text-[11px] font-bold text-gray-300">ردع التخريب (Anti-Raid)</span>
            </div>
            <div className="p-3 bg-[#181820]/70 border border-[#262633] rounded-xl flex items-center gap-2.5">
              <Ticket className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold text-gray-300">نظام التذاكر المنفصل</span>
            </div>
            <div className="p-3 bg-[#181820]/70 border border-[#262633] rounded-xl flex items-center gap-2.5">
              <Gavel className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px] font-bold text-gray-300">نظام المحكمة والإنذار</span>
            </div>
            <div className="p-3 bg-[#181820]/70 border border-[#262633] rounded-xl flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-[11px] font-bold text-gray-300">الرتب والترحيب التلقائي</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-gray-500 z-10 border-t border-[#1C1C24]">
        <div className="flex items-center justify-center gap-2">
          <span>OneBot v{BOT_CONFIG.version}</span>
          <span>•</span>
          <span>HyperSoft Production</span>
        </div>
      </footer>
    </div>
  );
};
