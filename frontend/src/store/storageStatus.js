// src/store/storageStatus.js

// 记录 localStorage 写入失败的状态，供 App 通过 useSyncExternalStore 订阅
let storageErrorMessage = null;
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeStorageError(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStorageError() {
  return storageErrorMessage;
}

export function setStorageError(message) {
  if (storageErrorMessage === message) return;
  storageErrorMessage = message;
  emit();
}
