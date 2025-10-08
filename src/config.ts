import type { AppConfig } from './types.ts';

function parseIntOrDefault(value: string | undefined, defaultValue: number): number {
	const parsed = value != null ? Number.parseInt(value, 10) : Number.NaN;
	return Number.isFinite(parsed) ? parsed : defaultValue;
}

export function loadConfig(): AppConfig {
	const {
		TARGET_URL,
		MALFUNCTION_SUBSTRING,
		TELEGRAM_BOT_TOKEN,
		TELEGRAM_CHAT_ID,
		CHECK_INTERVAL_MS,
		RETRY_COUNT,
		RETRY_BASE_DELAY_MS,
		ALERT_COOLDOWN_MS,
		LATENCY_THRESHOLD_MS,
		LATENCY_PERSISTENCE_MS,
		DATA_RETENTION_DAYS,
	} = Bun.env;

	if (!TARGET_URL) throw new Error('Missing env TARGET_URL');
	if (!MALFUNCTION_SUBSTRING) throw new Error('Missing env MALFUNCTION_SUBSTRING');
	if (!TELEGRAM_BOT_TOKEN) throw new Error('Missing env TELEGRAM_BOT_TOKEN');
	if (!TELEGRAM_CHAT_ID) throw new Error('Missing env TELEGRAM_CHAT_ID');

	const config: AppConfig = {
		targetUrl: TARGET_URL,
		malfunctionSubstring: MALFUNCTION_SUBSTRING,
		telegramBotToken: TELEGRAM_BOT_TOKEN,
		telegramChatId: TELEGRAM_CHAT_ID,
		checkIntervalMs: parseIntOrDefault(CHECK_INTERVAL_MS, 120000),
		retryCount: parseIntOrDefault(RETRY_COUNT, 3),
		retryBaseDelayMs: parseIntOrDefault(RETRY_BASE_DELAY_MS, 2000),
		alertCooldownMs: parseIntOrDefault(ALERT_COOLDOWN_MS, 600000),
		latencyThresholdMs: parseIntOrDefault(LATENCY_THRESHOLD_MS, 2000),
		latencyPersistenceMs: parseIntOrDefault(LATENCY_PERSISTENCE_MS, 600000),
		dataRetentionDays: parseIntOrDefault(DATA_RETENTION_DAYS, 7),
	};

	return config;
}
