// ============================================================
// VibeGuide - 通知 Toast 组件（增强版）
// 支持多条堆叠 + 类型自动识别 + 像素消散退场
// 支持可点击跳转外部链接
// ============================================================
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore, NotificationPayload } from '../../store/gameStore';

type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  exiting: boolean;
  url?: string; // 可选的外部链接
}

const ICON_MAP: Record<ToastType, string> = {
  success: '✦',
  warning: '⚠',
  error: '✖',
  info: '✧',
};

const DURATION = 3200;
const DURATION_ACTION = 8000; // 带链接的 toast 停留更久
const EXIT_MS = 400;

/** 根据通知首字符 / 关键字自动推断类型 */
function detectType(msg: string): ToastType {
  if (/^[🎉✅⭐🏆✦💰🧩]/.test(msg) || /完成|成功|获得|解锁/.test(msg)) return 'success';
  if (/^[⚠️⚡]/.test(msg) || /注意|警告/.test(msg)) return 'warning';
  if (/^[❌🚫💀]/.test(msg) || /错误|失败/.test(msg)) return 'error';
  return 'info';
}

let nextId = 0;

export const NotificationToast: React.FC = () => {
  const { ui, clearNotification } = useGameStore();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const prevMsg = useRef<string | null>(null);

  // 当 store 中的 notification 变化时，推入新 toast
  useEffect(() => {
    const payload: NotificationPayload | null = ui.notification;
    if (payload && payload.msg && payload.msg !== prevMsg.current) {
      prevMsg.current = payload.msg;
      const id = ++nextId;
      const type = detectType(payload.msg);
      const isPersistent = !!payload.persistent;
      const duration = payload.duration ?? (payload.url ? DURATION_ACTION : DURATION);
      setToasts((prev) => [...prev.slice(-4), { id, message: payload.msg, type, exiting: false, url: payload.url }]);

      // persistent 模式下不自动退出，仅手动关闭
      if (!isPersistent) {
        setTimeout(() => {
          setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
        }, duration);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration + EXIT_MS);
      }

      clearNotification();
    }
    if (!payload) prevMsg.current = null;
  }, [ui.notification, clearNotification]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), EXIT_MS);
  }, []);

  const handleClick = useCallback((toast: ToastItem) => {
    // 如果有链接，先打开外部页面
    if (toast.url) {
      if (window.electronAPI) {
        window.electronAPI.openExternal(toast.url);
      } else {
        window.open(toast.url, '_blank');
      }
    }
    dismiss(toast.id);
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`notification-toast notification-toast--${t.type}${t.exiting ? ' notification-toast--exit' : ''}${t.url ? ' notification-toast--action' : ''}`}
          onClick={() => handleClick(t)}
        >
          <span className="notification-toast__icon">{ICON_MAP[t.type]}</span>
          <span className="notification-toast__msg">{t.message}</span>
          {t.url && <span className="notification-toast__arrow">→</span>}
        </div>
      ))}
    </div>
  );
};
