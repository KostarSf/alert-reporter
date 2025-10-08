import type { AppConfig } from './types.ts';
import { DB } from './db.ts';

function escapePlain(text: string): string {
	// No markdown mode used; still normalize newlines
	return text.replace(/\r\n|\r|\n/g, '\n');
}

export class TelegramNotifier {
	private readonly config: AppConfig;
	private readonly db: DB;

	constructor(config: AppConfig, db: DB) {
		this.config = config;
		this.db = db;
	}

	private async send(text: string): Promise<void> {
		const url = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`;
		const body = {
			chat_id: this.config.telegramChatId,
			text: escapePlain(text),
			parse_mode: undefined,
			disable_web_page_preview: true,
		};
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			const t = await res.text();
			throw new Error(`Telegram send failed: ${res.status} ${t}`);
		}
	}

	private isOnCooldown(key: string): boolean {
		const last = this.db.getState(key);
		if (!last) return false;
		const lastMs = Number.parseInt(last, 10);
		return Number.isFinite(lastMs) && Date.now() - lastMs < this.config.alertCooldownMs;
	}

	private setCooldown(key: string): void {
		this.db.setState({ key, value: String(Date.now()) });
	}

	async notifyAvailability(message: string): Promise<void> {
		const cooldownKey = 'last_alert_availability';
		if (this.isOnCooldown(cooldownKey)) return;
		const text = `🚨 ${message}`;
		await this.send(text);
		this.db.insertEvent({ timestamp: new Date(), type: 'availability_alert', message: text });
		this.setCooldown(cooldownKey);
	}

	async notifyLatency(message: string): Promise<void> {
		const cooldownKey = 'last_alert_latency';
		if (this.isOnCooldown(cooldownKey)) return;
		const text = `🐢 ${message}`;
		await this.send(text);
		this.db.insertEvent({ timestamp: new Date(), type: 'latency_alert', message: text });
		this.setCooldown(cooldownKey);
	}

	async notifyStartup(message: string): Promise<void> {
		// Startup notifications should bypass throttling
		const text = `🚀 ${message}`;
		await this.send(text);
		this.db.insertEvent({ timestamp: new Date(), type: 'startup', message: text });
	}
}
