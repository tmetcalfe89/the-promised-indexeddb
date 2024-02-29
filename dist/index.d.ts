import { DatabaseType, IDBSchema } from "../types/types";
declare const Database: (name: string, schemas: IDBSchema[]) => DatabaseType;
export default Database;
