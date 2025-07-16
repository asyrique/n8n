import { OpenRouterClient, OpenAIClient } from '../ai-self-hosted.service';
import type { AiChatRequestDto, AiAskRequestDto, AiApplySuggestionRequestDto } from '@n8n/api-types';
import type { IUser } from 'n8n-workflow';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AI Self-Hosted Service', () => {
	const mockUser: IUser = {
		id: 'user123',
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
		role: 'global:owner',
		createdAt: new Date(),
		updatedAt: new Date(),
		disabled: false,
		globalScopes: [],
		mfaEnabled: false,
		mfaSecret: '',
		mfaRecoveryCodes: [],
		personalizationAnswers: null,
		settings: null,
		apiKey: '',
		password: '',
		resetPasswordToken: '',
		resetPasswordTokenExpiration: null,
		userClaimedAiCredits: false,
	};

	beforeEach(() => {
		mockFetch.mockClear();
	});

	describe('OpenRouterClient', () => {
		const client = new OpenRouterClient('test-api-key', 'test-model');

		describe('chat', () => {
			it('should make a chat request with correct parameters', async () => {
				const mockResponse = {
					ok: true,
					body: new ReadableStream(),
				};
				mockFetch.mockResolvedValueOnce(mockResponse as any);

				const payload: AiChatRequestDto = {
					payload: { message: 'Hello' },
					sessionId: 'session123',
				};

				const result = await client.chat(payload, { id: mockUser.id });

				expect(mockFetch).toHaveBeenCalledWith(
					'https://openrouter.ai/api/v1/chat/completions',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': 'Bearer test-api-key',
							'HTTP-Referer': 'https://n8n.io',
							'X-Title': 'n8n AI Assistant',
						},
						body: JSON.stringify({
							model: 'test-model',
							messages: [
								{
									role: 'system',
									content: 'You are an AI assistant for n8n, a workflow automation platform. Help users with their workflow automation questions and provide accurate, helpful responses.',
								},
								{
									role: 'user',
									content: 'Hello',
								},
							],
							stream: true,
						}),
					},
				);

				expect(result).toEqual({ body: mockResponse.body });
			});

			it('should handle API errors', async () => {
				const mockResponse = {
					ok: false,
					status: 401,
					statusText: 'Unauthorized',
				};
				mockFetch.mockResolvedValueOnce(mockResponse as any);

				const payload: AiChatRequestDto = {
					payload: { message: 'Hello' },
					sessionId: 'session123',
				};

				await expect(client.chat(payload, { id: mockUser.id })).rejects.toThrow(
					'OpenRouter API error: 401 Unauthorized',
				);
			});
		});

		describe('askAi', () => {
			it('should make an askAi request with correct parameters', async () => {
				const mockResponse = {
					ok: true,
					json: async () => ({
						choices: [
							{
								message: {
									content: 'This is a test response',
								},
							},
						],
					}),
				};
				mockFetch.mockResolvedValueOnce(mockResponse as any);

				const payload: AiAskRequestDto = {
					question: 'How do I use the HTTP node?',
					context: {
						schema: [
							{
								nodeName: 'HTTP Request',
								schema: {
									type: 'object',
									path: '/nodes/HttpRequest',
									value: 'http-request-schema',
								},
							},
						],
						inputSchema: {
							nodeName: 'HTTP Request',
							schema: {
								type: 'object',
								path: '/nodes/HttpRequest',
								value: 'input-schema',
							},
						},
						pushRef: 'push123',
						ndvPushRef: 'ndv123',
					},
					forNode: 'HTTP Request',
				};

				const result = await client.askAi(payload, { id: mockUser.id });

				expect(mockFetch).toHaveBeenCalledWith(
					'https://openrouter.ai/api/v1/chat/completions',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': 'Bearer test-api-key',
							'HTTP-Referer': 'https://n8n.io',
							'X-Title': 'n8n AI Assistant',
						},
						body: JSON.stringify({
							model: 'test-model',
							messages: [
								{
									role: 'system',
									content: 'You are an AI assistant for n8n, a workflow automation platform. Help users with their workflow automation questions and provide accurate, helpful responses.',
								},
								{
									role: 'user',
									content: expect.stringContaining('How do I use the HTTP node?'),
								},
							],
							stream: false,
						}),
					},
				);

				expect(result).toEqual({ answer: 'This is a test response' });
			});

			it('should handle missing response content', async () => {
				const mockResponse = {
					ok: true,
					json: async () => ({
						choices: [],
					}),
				};
				mockFetch.mockResolvedValueOnce(mockResponse as any);

				const payload: AiAskRequestDto = {
					question: 'Test question',
					context: {
						schema: [],
						inputSchema: {
							nodeName: 'Test',
							schema: { type: 'object', path: '/test', value: 'test' },
						},
						pushRef: 'push123',
						ndvPushRef: 'ndv123',
					},
					forNode: 'Test Node',
				};

				const result = await client.askAi(payload, { id: mockUser.id });

				expect(result).toEqual({ answer: 'No response generated' });
			});
		});

		describe('applySuggestion', () => {
			it('should return a successful response', async () => {
				const payload: AiApplySuggestionRequestDto = {
					sessionId: 'session123',
					suggestionId: 'suggestion456',
				};

				const result = await client.applySuggestion(payload, { id: mockUser.id });

				expect(result).toEqual({
					sessionId: 'session123',
					suggestionId: 'suggestion456',
					applied: true,
				});
			});
		});

		describe('generateAiCreditsCredentials', () => {
			it('should return API key credentials', async () => {
				const result = await client.generateAiCreditsCredentials(mockUser);

				expect(result).toEqual({
					apiKey: 'test-api-key',
					url: 'https://openrouter.ai/api/v1',
				});
			});
		});
	});

	describe('OpenAIClient', () => {
		const client = new OpenAIClient('test-openai-key', 'gpt-4');

		describe('chat', () => {
			it('should make a chat request with correct parameters', async () => {
				const mockResponse = {
					ok: true,
					body: new ReadableStream(),
				};
				mockFetch.mockResolvedValueOnce(mockResponse as any);

				const payload: AiChatRequestDto = {
					payload: { message: 'Hello OpenAI' },
					sessionId: 'session123',
				};

				const result = await client.chat(payload, { id: mockUser.id });

				expect(mockFetch).toHaveBeenCalledWith(
					'https://api.openai.com/v1/chat/completions',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': 'Bearer test-openai-key',
						},
						body: JSON.stringify({
							model: 'gpt-4',
							messages: [
								{
									role: 'system',
									content: 'You are an AI assistant for n8n, a workflow automation platform. Help users with their workflow automation questions and provide accurate, helpful responses.',
								},
								{
									role: 'user',
									content: 'Hello OpenAI',
								},
							],
							stream: true,
						}),
					},
				);

				expect(result).toEqual({ body: mockResponse.body });
			});

			it('should handle API errors', async () => {
				const mockResponse = {
					ok: false,
					status: 429,
					statusText: 'Too Many Requests',
				};
				mockFetch.mockResolvedValueOnce(mockResponse as any);

				const payload: AiChatRequestDto = {
					payload: { message: 'Hello' },
					sessionId: 'session123',
				};

				await expect(client.chat(payload, { id: mockUser.id })).rejects.toThrow(
					'OpenAI API error: 429 Too Many Requests',
				);
			});
		});

		describe('generateAiCreditsCredentials', () => {
			it('should return OpenAI API key credentials', async () => {
				const result = await client.generateAiCreditsCredentials(mockUser);

				expect(result).toEqual({
					apiKey: 'test-openai-key',
					url: 'https://api.openai.com/v1',
				});
			});
		});
	});
});