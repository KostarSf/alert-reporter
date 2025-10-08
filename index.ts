import { loadConfig } from './src/config.ts';
import { DB } from './src/db.ts';
import { runCheckWithRetry } from './src/checker.ts';
import { TelegramNotifier } from './src/telegram.ts';
import { runRetentionCleanup } from './src/cleanup.ts';
import { getStateDate, setStateDate } from './src/state.ts';

async function main(): Promise<void> {
	const config = loadConfig();
	const db = new DB();
	const notifier = new TelegramNotifier(config, db);

	let inFlight = false;

	console.log(
		`Observing URL: ${config.targetUrl} | interval: ${config.checkIntervalMs}ms | latency threshold: ${config.latencyThresholdMs}ms | retries: ${config.retryCount}`,
	);

	async function loop(): Promise<void> {
		if (inFlight) return;
		inFlight = true;
		try {
			const result = await runCheckWithRetry(config, db);
			// Availability alert if failed after retries
			if (!result.ok) {
				const msg = [
					`Availability issue at ${new Date().toISOString()}`,
					`URL: ${result.url}`,
					`Status: ${result.statusCode ?? 'N/A'}`,
					`Latency: ${Math.round(result.latencyMs)} ms`,
					`Contains malfunction substring: ${result.containsMalfunction}`,
					`Error: ${result.errorText ?? 'n/a'}`,
				].join('\n');
				console.error(msg);
				await notifier.notifyAvailability(msg);
			}

			// Latency persistence logic
			const keySince = 'latency_degraded_since';
			const since = getStateDate(db, keySince);
			if (result.ok && result.latencyMs > config.latencyThresholdMs) {
				console.warn(
					`High latency observed: ${Math.round(result.latencyMs)}ms (> ${config.latencyThresholdMs}ms) for ${result.url}`,
				);
				if (!since) setStateDate(db, keySince, new Date());
			} else {
				// clear when back to normal or not ok (we alert via availability)
				db.setState({ key: keySince, value: '' });
			}
			const updatedSince = getStateDate(db, keySince);
			if (updatedSince) {
				const duration = Date.now() - updatedSince.getTime();
				if (duration >= config.latencyPersistenceMs) {
					const msg = [
						`High latency persisting ${Math.round(duration / 1000)}s as of ${new Date().toISOString()}`,
						`URL: ${result.url}`,
						`Last latency: ${Math.round(result.latencyMs)} ms (threshold ${config.latencyThresholdMs} ms)`,
					].join('\n');
					console.warn(msg);
					await notifier.notifyLatency(msg);
				}
			}

			runRetentionCleanup(db, config);
		} catch (e) {
			console.error(e);
		} finally {
			inFlight = false;
		}
	}

	// startup notification (bypass cooldown)
	try {
		await notifier.notifyStartup(
			[`Monitor started at ${new Date().toISOString()}`, `URL: ${config.targetUrl}`].join('\n'),
		);
		console.log('Startup notification sent');
	} catch (e) {
		console.error('Failed to send startup notification', e);
	}

	// immediate run then interval
	await loop();
	setInterval(loop, config.checkIntervalMs);
}

void main();
