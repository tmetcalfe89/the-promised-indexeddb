import { DatabaseType, IDBSchema } from "../types/types";
declare const Database: <T extends object>(name: string, schemas: IDBSchema[]) => DatabaseType<T>;
export default Database;
