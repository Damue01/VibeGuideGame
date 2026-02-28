// ============================================================
// VibeGuide - 端口检测模块
// 检测 localhost 上是否有服务运行
// ============================================================
import * as net from 'net';

export class PortChecker {
  /** 检查指定端口是否有服务在监听 */
  isPortOpen(port: number, host: string = '127.0.0.1'): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host);
    });
  }
}
