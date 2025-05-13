import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../src/index.js';

describe('Cloudflare Worker for Gemini API Gateway', () => {
	let env;
	let ctx;

	beforeEach(() => {
		env = {
			GEMINI_API_KEY: 'test-api-key',
		};

		ctx = {};

		// Mock fetch for testing
		global.fetch = vi.fn();
	});

	it('should return health check response', async () => {
		const request = new Request('https://example.com/health');
		const response = await worker.fetch(request, env, ctx);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.status).toBe('ok');
	});

	it('should handle preflight OPTIONS requests', async () => {
		const request = new Request('https://example.com/api/generate', {
			method: 'OPTIONS',
			headers: {
				Origin: 'http://localhost:5173',
			},
		});

		const response = await worker.fetch(request, env, ctx);

		expect(response.status).toBe(204);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
			'http://localhost:5173'
		);
		expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
			'POST, OPTIONS'
		);
	});

	it('should return 404 for unknown routes', async () => {
		const request = new Request('https://example.com/unknown-route');
		const response = await worker.fetch(request, env, ctx);
		const data = await response.json();

		expect(response.status).toBe(404);
		expect(data.error).toBe('Not found');
	});

	it('should validate required prompt field', async () => {
		const request = new Request('https://example.com/api/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				// No prompt provided
				modelName: 'gemini-pro',
			}),
		});

		const response = await worker.fetch(request, env, ctx);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe('Prompt is required');
	});

	// Add more tests for the actual API call handling with mocked responses
});
