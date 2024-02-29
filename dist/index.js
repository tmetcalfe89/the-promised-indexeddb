const Database = (name, schemas) => {
    const version = Math.max(...schemas.map(({ fields }) => Math.max(...Object.keys(fields).map((e) => +e))));
    const dbOpener = new Promise((resolve, reject) => {
        const request = indexedDB.open(name, version);
        request.onerror = (event) => {
            const errorEvent = event;
            reject(errorEvent.error);
        };
        request.onsuccess = (event) => {
            const ret = event.target;
            const db = ret.result;
            db.onversionchange = () => {
                db.close();
                alert("A new version of this page is ready. Please reload or close this tab!");
            };
            resolve(db);
        };
        request.onupgradeneeded = (event) => {
            const oldVersion = event.oldVersion;
            const db = event.target.result;
            for (const { name, fields } of schemas) {
                let objectStore;
                if (!db.objectStoreNames.contains(name)) {
                    objectStore = db.createObjectStore(name, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                }
                else {
                    objectStore = db.transaction([name]).objectStore(name);
                }
                Object.entries(fields)
                    .map(([v, f]) => [+v, f])
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
    const getStore = (storeName) => {
        return {
            create: async (data) => {
                const db = await dbOpener;
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction([storeName], "readwrite");
                    const store = transaction.objectStore(storeName);
                    const request = store.add(data);
                    request.onsuccess = () => resolve({ id: +request.result, ...data });
                    request.onerror = (event) => reject(event.target?.error);
                });
            },
            getById: async (id) => {
                const db = await dbOpener;
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction([storeName]);
                    const store = transaction.objectStore(storeName);
                    const request = store.get(id);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = (event) => reject(event.target?.error);
                });
            },
            getAll: async () => {
                const db = await dbOpener;
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction([storeName]);
                    const store = transaction.objectStore(storeName);
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = (event) => reject(event.target?.error);
                });
            },
            delete: async (id) => {
                const db = await dbOpener;
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction([storeName], "readwrite");
                    const store = transaction.objectStore(storeName);
                    const request = store.delete(id);
                    request.onsuccess = () => resolve();
                    request.onerror = (event) => reject(event.target?.error);
                });
            },
            update: async (id, data) => {
                const db = await dbOpener;
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction([storeName], "readwrite");
                    const store = transaction.objectStore(storeName);
                    const updated = { ...data, id };
                    const request = store.put(updated);
                    request.onsuccess = () => resolve(updated);
                    request.onerror = (event) => reject(event.target?.error);
                });
            },
            getByField: async (fieldName, fieldValue) => {
                const db = await dbOpener;
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction([storeName]);
                    const store = transaction.objectStore(storeName);
                    const index = store.index(fieldName);
                    const request = index.getAll(fieldValue);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = (event) => reject(event.target?.error);
                });
            },
        };
    };
    return {
        getStore,
    };
};
export default Database;
//# sourceMappingURL=index.js.map