import { Database } from 'bun:sqlite';
import type { AlertType, CheckResult, EventRecord, StateEntry } from './types.ts';

const DEFAULT_DB_PATH = Bun.env.DB_FILE_PATH ?? 'monitor-data/monitor.db';

export class DB {
	private readonly db: Database;

	constructor(path: string = DEFAULT_DB_PATH) {
		this.db = new Database(path, { create: true });
		this.init();
	}

	private init(): void {
		this.db.run(`
			CREATE TABLE IF NOT EXISTS checks (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				ts TEXT NOT NULL,
				url TEXT NOT NULL,
				ok INTEGER NOT NULL,
				status_code INTEGER,
				latency_ms INTEGER NOT NULL,
				contains_malfunction INTEGER NOT NULL,
				error_text TEXT
			);
		`);
		this.db.run(`CREATE INDEX IF NOT EXISTS idx_checks_ts ON checks(ts);`);

		this.db.run(`
			CREATE TABLE IF NOT EXISTS events (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				ts TEXT NOT NULL,
				type TEXT NOT NULL,
				message TEXT NOT NULL
			);
		`);
		this.db.run(`CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);`);

		this.db.run(`
			CREATE TABLE IF NOT EXISTS state (
				key TEXT PRIMARY KEY,
				value TEXT NOT NULL
			);
		`);
	}

	insertCheck(result: CheckResult): void {
		const stmt = this.db.query(
			`INSERT INTO checks (ts, url, ok, status_code, latency_ms, contains_malfunction, error_text)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		);
		stmt.run(
			result.timestamp.toISOString(),
			result.url,
			result.ok ? 1 : 0,
			result.statusCode ?? null,
			Math.round(result.latencyMs),
			result.containsMalfunction ? 1 : 0,
			result.errorText ?? null,
		);
	}

	insertEvent(record: EventRecord): void {
		const stmt = this.db.query(
			`INSERT INTO events (ts, type, message) VALUES (?, ?, ?)`
		);
		stmt.run(record.timestamp.toISOString(), record.type, record.message);
	}

	getState(key: string): string | undefined {
		const row = this.db.query(`SELECT value FROM state WHERE key = ?`).get(key) as { value: string } | undefined;
		return row?.value;
	}

	setState(entry: StateEntry): void {
		const stmt = this.db.query(`INSERT INTO state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`);
		stmt.run(entry.key, entry.value);
	}

	deleteOldData(retentionDays: number): void {
		const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
		const cutoffIso = cutoff.toISOString();
		this.db.run(`DELETE FROM checks WHERE ts < ?`, [cutoffIso]);
		this.db.run(`DELETE FROM events WHERE ts < ?`, [cutoffIso]);
	}
}
