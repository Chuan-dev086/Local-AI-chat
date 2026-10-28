const DB_NAME = "local-ai-chat";
const STORE_NAME = "app-state";
const STATE_KEY = "sessions";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB upgrade is blocked."));
  });
}

async function runTransaction(mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let result;
    try {
      result = action(store);
    } catch (error) {
      database.close();
      reject(error);
      return;
    }
    transaction.oncomplete = () => {
      database.close();
      resolve(result?.result);
    };
    transaction.onerror = transaction.onabort = () => {
      database.close();
      reject(transaction.error || new Error("IndexedDB transaction failed."));
    };
  });
}

export function readChatState() {
  return runTransaction("readonly", (store) => store.get(STATE_KEY));
}

let pendingWrite = Promise.resolve();

export function writeChatState(state) {
  pendingWrite = pendingWrite
    .catch(() => {})
    .then(() => runTransaction("readwrite", (store) => store.put(state, STATE_KEY)));
  return pendingWrite;
}

export function clearChatState() {
  pendingWrite = pendingWrite
    .catch(() => {})
    .then(() => runTransaction("readwrite", (store) => store.delete(STATE_KEY)));
  return pendingWrite;
}
