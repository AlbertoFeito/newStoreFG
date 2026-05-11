import { useEffect, useState, useCallback } from 'react';
import { SQLiteDatabase, openDatabaseSync } from 'expo-sqlite';
import { migrateDbIfNeeded } from '@/db/schema';

let dbInstance: SQLiteDatabase | null = null;

export function getDatabase(): SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = openDatabaseSync('mitienda.db');
  }
  return dbInstance;
}

export function useDatabase() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      const database = getDatabase();
      await migrateDbIfNeeded(database);
      setDb(database);
      setIsReady(true);
    }
    init();
  }, []);

  return { db, isReady };
}
