import type { AppConfig, CheckResult } from './types.ts';
import { DB } from './db.ts';

async function performSingleCheck(config: AppConfig): Promise<CheckResult> {
	const start = performance.now();
	let statusCode: number | undefined;
	let containsMalfunction = false;
	let errorText: string | undefined;
	try {
		const res = await fetch(config.targetUrl, { method: 'GET' });
		statusCode = res.status;
		const text = await res.text();
		containsMalfunction = text.includes(config.malfunctionSubstring);
		const ok = res.status === 200 && !containsMalfunction;
		const latencyMs = performance.now() - start;
		return {
			timestamp: new Date(),
			url: config.targetUrl,
			ok,
			statusCode,
			latencyMs,
			containsMalfunction,
			errorText,
		};
	} catch (err) {
		errorText = err instanceof Error ? err.message : 'Unknown error';
		const latencyMs = performance.now() - start;
		return {
			timestamp: new Date(),
			url: config.targetUrl,
			ok: false,
			statusCode,
			latencyMs,
			containsMalfunction,
			errorText,
		};
	}
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runCheckWithRetry(config: AppConfig, db: DB): Promise<CheckResult> {
	let attempt = 0;
	let last: CheckResult | undefined;
	while (attempt < config.retryCount) {
		last = await performSingleCheck(config);
		db.insertCheck(last);
		if (last.ok) {
			return last;
		}
		attempt += 1;
		if (attempt < config.retryCount) {
			const backoff = config.retryBaseDelayMs * Math.pow(2, attempt - 1);
			await delay(backoff);
		}
	}
	// After retries, return last (failed)
	return last!;
}
