export interface Field {
  index?: boolean;
  unique?: boolean;
}

export interface IDBSchema {
  name: string;
  fields: Record<number, Record<string, Field>>;
}

export interface DatabaseType<T> {
  getStore: (storeName: string) => {
    create: (data: T) => Promise<T & { id: number }>;
    getById: (id: number) => Promise<T & { id: number }>;
    getAll: () => Promise<(T & { id: number })[]>;
    delete: (id: number) => Promise<void>;
    update: (id: number, data: T) => Promise<T & { id: number }>;
    getByField: (
      fieldName: string,
      fieldValue: IDBValidKey | IDBKeyRange | null | undefined
    ) => Promise<(T & { id: number })[]>;
  };
}
