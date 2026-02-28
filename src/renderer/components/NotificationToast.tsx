// ============================================================
// VibeGuide - 通知 Toast 组件（增强版）
// 支持多条堆叠 + 类型自动识别 + 像素消散退场
// ============================================================
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  exiting: boolean;
}

const ICON_MAP: Record<ToastType, string> = {
  success: '✦',
  warning: '⚠',
  error: '✖',
  info: '✧',
};

const DURATION = 3200;
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
    const msg = ui.notification;
    if (msg && msg !== prevMsg.current) {
      prevMsg.current = msg;
      const id = ++nextId;
      const type = detectType(msg);
      setToasts((prev) => [...prev.slice(-4), { id, message: msg, type, exiting: false }]);

      // 自动退出
      setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      }, DURATION);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, DURATION + EXIT_MS);

      clearNotification();
    }
    if (!msg) prevMsg.current = null;
  }, [ui.notification, clearNotification]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), EXIT_MS);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`notification-toast notification-toast--${t.type}${t.exiting ? ' notification-toast--exit' : ''}`}
          onClick={() => dismiss(t.id)}
        >
          <span className="notification-toast__icon">{ICON_MAP[t.type]}</span>
          <span className="notification-toast__msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
};
