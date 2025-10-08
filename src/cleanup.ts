import { DB } from './db.ts';
import type { AppConfig } from './types.ts';

export function runRetentionCleanup(db: DB, config: AppConfig): void {
	db.deleteOldData(config.dataRetentionDays);
}
