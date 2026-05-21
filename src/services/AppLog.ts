const MAX_LOGS = 500;

type LogEntry = {
  time: string;
  level: string;
  message: string;
};

let logs: LogEntry[] = [];
let originalConsole: Record<string, (...args: any[]) => void> = {};

function addLog(level: string, ...args: any[]) {
  const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  logs.push({time: new Date().toISOString().slice(11, 23), level, message: msg});
  if (logs.length > MAX_LOGS) logs.shift();
}

export function initLogCapture() {
  if (originalConsole.log) return;
  const methods = ['log', 'warn', 'error'] as const;
  for (const m of methods) {
    originalConsole[m] = (console as any)[m].bind(console);
    (console as any)[m] = (...args: any[]) => {
      originalConsole[m](...args);
      addLog(m === 'error' ? 'ERROR' : m === 'warn' ? 'WARN' : 'INFO', ...args);
    };
  }
  console.log('LogCapture initialized');
}

export function getLogs(): LogEntry[] {
  return [...logs];
}

export function clearLogs() {
  logs = [];
}
