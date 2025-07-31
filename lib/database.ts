
import initSqlJs, { type Database } from 'sql.js';
import type { Expense } from '../types';

// IndexedDB configuration
const INDEXEDDB_NAME = 'sqlite-expenses-db';
const INDEXEDDB_VERSION = 1;
const INDEXEDDB_STORE_NAME = 'database';
const INDEXEDDB_KEY = 'db_file';

let db: Database | null = null;
let dbReady: Promise<Database> | null = null; // Singleton promise to prevent multiple initializations

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject('IndexedDB is not supported by this browser.');
      return;
    }
    const request = indexedDB.open(INDEXEDDB_NAME, INDEXEDDB_VERSION);
    request.onerror = () => reject('Error opening IndexedDB');
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(INDEXEDDB_STORE_NAME)) {
        db.createObjectStore(INDEXEDDB_STORE_NAME);
      }
    };
  });
}

async function loadDbFromIndexedDb(): Promise<Uint8Array | null> {
  const idb = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const transaction = idb.transaction(INDEXEDDB_STORE_NAME, 'readonly');
    const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
    const request = store.get(INDEXEDDB_KEY);
    request.onerror = () => reject('Error loading from IndexedDB');
    request.onsuccess = () => resolve((request.result as Uint8Array) || null);
    transaction.oncomplete = () => idb.close();
  });
}

async function saveDbToIndexedDb(data: Uint8Array): Promise<void> {
  const idb = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const transaction = idb.transaction(INDEXEDDB_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
    const request = store.put(data, INDEXEDDB_KEY);
    request.onerror = () => reject('Error saving to IndexedDB');
    request.onsuccess = () => resolve();
    transaction.oncomplete = () => idb.close();
  });
}

async function initializeDatabase(): Promise<Database> {
  const SQL = await initSqlJs({
    // Point to a reliable CDN for the wasm file to fix instantiation errors.
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}`,
  });
  const savedDb = await loadDbFromIndexedDb();
  const database = savedDb ? new SQL.Database(savedDb) : new SQL.Database();

  const createTableStmt = `
      CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          payer TEXT NOT NULL,
          participants TEXT NOT NULL
      );
  `;
  database.run(createTableStmt);
  db = database;
  if (!savedDb) {
      await persistDb();
  }
  return db;
}

function getDb(): Promise<Database> {
  if (!dbReady) {
    dbReady = initializeDatabase();
  }
  return dbReady;
}

async function persistDb() {
  const database = await getDb();
  const data = database.export();
  await saveDbToIndexedDb(data);
}

function mapResultsToExpenses(results: any[]): Expense[] {
    if (!results || results.length === 0) return [];
    const { columns, values } = results[0];
    return values.map((row : any[]) => {
        const expenseObj: any = {};
        columns.forEach((col: string, i: number) => {
            expenseObj[col] = row[i];
        });
        return {
            ...expenseObj,
            participants: JSON.parse(expenseObj.participants),
        } as Expense;
    }).sort((a, b) => new Date(b.id.split('+')[0]).getTime() - new Date(a.id.split('+')[0]).getTime());
}


export async function dbGetExpenses(): Promise<Expense[]> {
  const database = await getDb();
  const results = database.exec('SELECT * FROM expenses ORDER BY id DESC');
  return mapResultsToExpenses(results);
}

export async function dbAddExpense(expense: Expense): Promise<void> {
  const database = await getDb();
  database.run('INSERT INTO expenses (id, description, amount, payer, participants) VALUES (?, ?, ?, ?, ?)', [
    expense.id,
    expense.description,
    expense.amount,
    expense.payer,
    JSON.stringify(expense.participants),
  ]);
  await persistDb();
}

export async function dbDeleteExpense(id: string): Promise<void> {
  const database = await getDb();
  database.run('DELETE FROM expenses WHERE id = ?', [id]);
  await persistDb();
}

export async function dbClearAllExpenses(): Promise<void> {
  const database = await getDb();
  database.run('DELETE FROM expenses');
  await persistDb();
}

export async function dbImportExpenses(expenses: Expense[]): Promise<void> {
    const database = await getDb();
    database.run('DELETE FROM expenses');
    const stmt = database.prepare('INSERT INTO expenses (id, description, amount, payer, participants) VALUES (?, ?, ?, ?, ?)');
    try {
        expenses.forEach(expense => {
            stmt.run([
                expense.id,
                expense.description,
                expense.amount,
                expense.payer,
                JSON.stringify(expense.participants),
            ]);
        });
    } finally {
        stmt.free();
    }
    await persistDb();
}
