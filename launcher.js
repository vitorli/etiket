import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const appUrl = 'http://127.0.0.1:3000';
const ollamaUrl = 'http://127.0.0.1:11434';

async function isAppRunning() {
  try {
    const response = await fetch(appUrl, { signal: AbortSignal.timeout(800) });
    return response.ok && (await response.text()).includes('<title>Этикет');
  } catch {
    return false;
  }
}

async function isOllamaRunning() {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(800) });
    return response.ok;
  } catch {
    return false;
  }
}

function startDetached(command, args, options = {}) {
  const process = spawn(command, args, {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    ...options,
  });
  process.on('error', () => {});
  process.unref();
}

async function waitUntil(check) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (await check()) return true;
  }
  return false;
}

function openBrowser() {
  startDetached('cmd.exe', ['/c', 'start', '', appUrl], { windowsHide: true });
}

try {
  if (!(await isOllamaRunning())) {
    startDetached('ollama', ['serve'], { windowsHide: true });
    if (!(await waitUntil(isOllamaRunning))) {
      throw new Error('Не удалось запустить Ollama. Убедитесь, что она установлена.');
    }
  }

  if (!(await isAppRunning())) {
    startDetached(process.execPath, [path.join(root, 'server.js')], { windowsHide: false });
    if (!(await waitUntil(isAppRunning))) {
      throw new Error('Не удалось запустить приложение. Проверьте, свободен ли порт 3000.');
    }
  }

  openBrowser();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
