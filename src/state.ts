import { DB } from './db.ts';

export function getStateDate(db: DB, key: string): Date | undefined {
	const v = db.getState(key);
	if (!v) return undefined;
	const n = Number.parseInt(v, 10);
	if (!Number.isFinite(n)) return undefined;
	return new Date(n);
}

export function setStateDate(db: DB, key: string, date: Date): void {
	db.setState({ key, value: String(date.getTime()) });
}
