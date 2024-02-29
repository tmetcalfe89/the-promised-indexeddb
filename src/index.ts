import {
  DatabaseStoreType,
  DatabaseType,
  Field,
  IDBSchema,
} from "../types/types";

const Database = (name: string, schemas: IDBSchema[]): DatabaseType => {
  const version = Math.max(
    ...schemas.map(({ fields }) =>
      Math.max(...Object.keys(fields).map((e) => +e))
    )
  );
  const dbOpener = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onerror = (event) => {
      const errorEvent = event as unknown as IDBRequest;
      reject(errorEvent.error);
    };
    request.onsuccess = (event) => {
      const ret = event.target as IDBOpenDBRequest;
      const db = ret.result;
      db.onversionchange = () => {
        db.close();
        alert(
          "A new version of this page is ready. Please reload or close this tab!"
        );
      };
      resolve(db);
    };
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const oldVersion = event.oldVersion;
      const db = (event.target as IDBOpenDBRequest).result;
      for (const { name, fields } of schemas) {
        let objectStore: IDBObjectStore;
        if (!db.objectStoreNames.contains(name)) {
          objectStore = db.createObjectStore(name, {
            keyPath: "id",
            autoIncrement: true,
          });
        } else {
          objectStore = db.transaction([name]).objectStore(name);
        }
        Object.entries(fields)
          .map(([v, f]): [number, Record<string, Field>] => [+v, f])
          .filter(([v]) => v > oldVersion)
          .sort(([a], [b]) => b - a)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .forEach(([_v, field]) => {
            Object.entries(field).forEach(([key, { unique, index }]) => {
              if (index) {
                objectStore.createIndex(key, key, { unique });
              }
            });
          });
      }
    };
  });

  const getStore = <T extends object>(
    storeName: string
  ): DatabaseStoreType<T> => {
    return {
      create: async (data: T) => {
        const db = await dbOpener;
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName], "readwrite");
          const store = transaction.objectStore(storeName);
          const request = store.add(data);
          request.onsuccess = () => resolve({ id: +request.result, ...data });
          request.onerror = (event) =>
            reject((event.target as ErrorEvent | null)?.error);
        });
      },
      getById: async (id: number) => {
        const db = await dbOpener;
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName]);
          const store = transaction.objectStore(storeName);
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = (event) =>
            reject((event.target as ErrorEvent | null)?.error);
        });
      },
      getAll: async () => {
        const db = await dbOpener;
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName]);
          const store = transaction.objectStore(storeName);
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = (event) =>
            reject((event.target as ErrorEvent | null)?.error);
        });
      },
      delete: async (id: number) => {
        const db = await dbOpener;
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName], "readwrite");
          const store = transaction.objectStore(storeName);
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = (event) =>
            reject((event.target as ErrorEvent | null)?.error);
        });
      },
      update: async (id: number, data: T) => {
        const db = await dbOpener;
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName], "readwrite");
          const store = transaction.objectStore(storeName);
          const updated = { ...data, id };
          const request = store.put(updated);
          request.onsuccess = () => resolve(updated);
          request.onerror = (event) =>
            reject((event.target as ErrorEvent | null)?.error);
        });
      },
      getByField: async (
        fieldName: string,
        fieldValue: IDBValidKey | IDBKeyRange | null | undefined
      ) => {
        const db = await dbOpener;
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName]);
          const store = transaction.objectStore(storeName);
          const index = store.index(fieldName) as IDBIndex;
          const request = index.getAll(fieldValue);
          request.onsuccess = () => resolve(request.result);
          request.onerror = (event) =>
            reject((event.target as ErrorEvent | null)?.error);
        });
      },
    };
  };

  return {
    getStore,
  };
};

export default Database;
