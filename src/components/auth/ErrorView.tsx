import React from 'react';
import { BOT_CONFIG } from '../../config/botConfig';
import { AlertTriangle, ShieldX, ServerCrash, ArrowRight, RotateCw } from 'lucide-react';

interface ErrorViewProps {
  code: 401 | 403 | 404 | 500;
  message?: string;
  onBackToServers?: () => void;
  onRetry?: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  code,
  message,
  onBackToServers,
  onRetry
}) => {
  const getErrorContent = () => {
    switch (code) {
      case 401:
        return {
          title: "جلسة منتهية أو غير مسجلة (401)",
          desc: message || "يتطلب هذا الإجراء تسجيل الدخول عبر حساب ديسكورد مصرح به.",
          icon: ShieldX,
          color: "text-amber-400",
          actionText: "تسجيل الدخول",
          action: () => { window.location.href = '/api/auth/login'; }
        };
      case 403:
        return {
          title: "غير مصرح بالوصول (403)",
          desc: message || "أنت لا تمتلك صلاحيات Administrator أو Manage Server لإدارة هذا السيرفر.",
          icon: ShieldX,
          color: "text-rose-500",
          actionText: "العودة إلى قائمة سيرفراتي",
          action: onBackToServers
        };
      case 404:
        return {
          title: "السيرفر غير متوفر أو غير مضاف (404)",
          desc: message || "لم يتم العثور على هذا السيرفر في سجلات البوت، أو تم إزالة OneBot منه.",
          icon: AlertTriangle,
          color: "text-amber-500",
          actionText: "اختيار سيرفر آخر",
          action: onBackToServers
        };
      case 500:
      default:
        return {
          title: "حدث خطأ غير متوقع (500)",
          desc: message || "فشل الاتصال بخوادم OneBot أو حدث خطأ أثناء جلب البيانات.",
          icon: ServerCrash,
          color: "text-rose-400",
          actionText: "إعادة المحاولة",
          action: onRetry || (() => window.location.reload())
        };
    }
  };

  const content = getErrorContent();
  const Icon = content.icon;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-[#121217] border border-[#22222E] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#181822] border border-[#2A2A38] mx-auto flex items-center justify-center">
          <Icon className={`w-8 h-8 ${content.color}`} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white">{content.title}</h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{content.desc}</p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {content.action && (
            <button
              onClick={content.action}
              className="flex-1 flex items-center justify-center gap-2 bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-[#E53935]/20 transition-all cursor-pointer"
            >
              <span>{content.actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {onRetry && code !== 500 && (
            <button
              onClick={onRetry}
              className="px-4 py-3 bg-[#1A1A24] hover:bg-[#222230] text-gray-300 font-bold text-xs rounded-xl border border-[#2C2C3C] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>تحديث</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
