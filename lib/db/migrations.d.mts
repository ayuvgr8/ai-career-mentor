import type { ClientBase } from "pg";

export function sslFor(connectionString: string): { rejectUnauthorized: boolean } | undefined;
export function runMigrations(client: ClientBase, dir: string, log?: (message: string) => void): Promise<number>;
