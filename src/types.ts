export type AlertType = 'availability_alert' | 'latency_alert' | 'startup';

export interface AppConfig {
	readonly targetUrl: string;
	readonly malfunctionSubstring: string;
	readonly telegramBotToken: string;
	readonly telegramChatId: string;
	readonly checkIntervalMs: number;
	readonly retryCount: number;
	readonly retryBaseDelayMs: number;
	readonly alertCooldownMs: number;
	readonly latencyThresholdMs: number;
	readonly latencyPersistenceMs: number;
	readonly dataRetentionDays: number;
}

export interface CheckResult {
	readonly timestamp: Date;
	readonly url: string;
	readonly ok: boolean;
	readonly statusCode?: number;
	readonly latencyMs: number;
	readonly containsMalfunction: boolean;
	readonly errorText?: string;
}

export interface EventRecord {
	readonly id?: number;
	readonly timestamp: Date;
	readonly type: AlertType;
	readonly message: string;
}

export interface StateEntry {
	readonly key: string;
	readonly value: string; // Empty string clears the value (used to clear degraded-since)
}
