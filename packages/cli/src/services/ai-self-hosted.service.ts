import type {
	AiApplySuggestionRequestDto,
	AiAskRequestDto,
	AiChatRequestDto,
} from '@n8n/api-types';
import type { IUser } from 'n8n-workflow';

export interface AiSelfHostedResponse {
	body?: ReadableStream;
	[key: string]: any;
}

export interface AiSelfHostedApplySuggestionResponse {
	sessionId: string;
	suggestionId: string;
	[key: string]: any;
}

export interface AiSelfHostedAskAiResponse {
	answer: string;
	[key: string]: any;
}

export interface AiSelfHostedCredentials {
	apiKey: string;
	url: string;
}

export interface AiSelfHostedClient {
	chat(payload: AiChatRequestDto, user: { id: string }): Promise<AiSelfHostedResponse>;
	applySuggestion(payload: AiApplySuggestionRequestDto, user: { id: string }): Promise<AiSelfHostedApplySuggestionResponse>;
	askAi(payload: AiAskRequestDto, user: { id: string }): Promise<AiSelfHostedAskAiResponse>;
	generateAiCreditsCredentials(user: IUser): Promise<AiSelfHostedCredentials>;
}

export class OpenRouterClient implements AiSelfHostedClient {
	private readonly apiKey: string;
	private readonly model: string;
	private readonly baseUrl = 'https://openrouter.ai/api/v1';

	constructor(apiKey: string, model: string = 'meta-llama/llama-3.1-8b-instruct:free') {
		this.apiKey = apiKey;
		this.model = model;
	}

	async chat(payload: AiChatRequestDto, user: { id: string }): Promise<AiSelfHostedResponse> {
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.apiKey}`,
				'HTTP-Referer': 'https://n8n.io',
				'X-Title': 'n8n AI Assistant',
			},
			body: JSON.stringify({
				model: this.model,
				messages: this.convertPayloadToMessages(payload),
				stream: true,
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
		}

		return {
			body: response.body,
		};
	}

	async applySuggestion(payload: AiApplySuggestionRequestDto, user: { id: string }): Promise<AiSelfHostedApplySuggestionResponse> {
		// For self-hosted, we'll simulate the suggestion application
		// This would typically involve storing and retrieving suggestion data
		return {
			sessionId: payload.sessionId,
			suggestionId: payload.suggestionId,
			applied: true,
		};
	}

	async askAi(payload: AiAskRequestDto, user: { id: string }): Promise<AiSelfHostedAskAiResponse> {
		const prompt = this.buildAskAiPrompt(payload);
		
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.apiKey}`,
				'HTTP-Referer': 'https://n8n.io',
				'X-Title': 'n8n AI Assistant',
			},
			body: JSON.stringify({
				model: this.model,
				messages: [
					{
						role: 'system',
						content: 'You are an AI assistant for n8n, a workflow automation platform. Help users with their workflow automation questions and provide accurate, helpful responses.',
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				stream: false,
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return {
			answer: data.choices[0]?.message?.content || 'No response generated',
		};
	}

	async generateAiCreditsCredentials(user: IUser): Promise<AiSelfHostedCredentials> {
		// For self-hosted, we return the user's configured API key
		return {
			apiKey: this.apiKey,
			url: this.baseUrl,
		};
	}

	private convertPayloadToMessages(payload: AiChatRequestDto): Array<{ role: string; content: string }> {
		// Convert the payload to OpenAI-compatible messages format
		const messages: Array<{ role: string; content: string }> = [];
		
		// Add system message
		messages.push({
			role: 'system',
			content: 'You are an AI assistant for n8n, a workflow automation platform. Help users with their workflow automation questions and provide accurate, helpful responses.',
		});

		// Extract user message from payload
		if (payload.payload && typeof payload.payload === 'object') {
			const userMessage = (payload.payload as any).message || (payload.payload as any).question || JSON.stringify(payload.payload);
			messages.push({
				role: 'user',
				content: userMessage,
			});
		}

		return messages;
	}

	private buildAskAiPrompt(payload: AiAskRequestDto): string {
		let prompt = `Question: ${payload.question}\n\n`;
		
		if (payload.context) {
			prompt += `Context:\n`;
			if (payload.context.schema) {
				prompt += `Available nodes and their schemas:\n`;
				for (const node of payload.context.schema) {
					prompt += `- ${node.nodeName}: ${JSON.stringify(node.schema)}\n`;
				}
			}
			
			if (payload.context.inputSchema) {
				prompt += `Input schema for ${payload.context.inputSchema.nodeName}: ${JSON.stringify(payload.context.inputSchema.schema)}\n`;
			}
		}
		
		prompt += `\nFor node: ${payload.forNode}\n\n`;
		prompt += `Please provide a helpful answer for this n8n workflow automation question.`;
		
		return prompt;
	}
}

export class OpenAIClient implements AiSelfHostedClient {
	private readonly apiKey: string;
	private readonly model: string;
	private readonly baseUrl = 'https://api.openai.com/v1';

	constructor(apiKey: string, model: string = 'gpt-4o-mini') {
		this.apiKey = apiKey;
		this.model = model;
	}

	async chat(payload: AiChatRequestDto, user: { id: string }): Promise<AiSelfHostedResponse> {
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify({
				model: this.model,
				messages: this.convertPayloadToMessages(payload),
				stream: true,
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
		}

		return {
			body: response.body,
		};
	}

	async applySuggestion(payload: AiApplySuggestionRequestDto, user: { id: string }): Promise<AiSelfHostedApplySuggestionResponse> {
		// For self-hosted, we'll simulate the suggestion application
		return {
			sessionId: payload.sessionId,
			suggestionId: payload.suggestionId,
			applied: true,
		};
	}

	async askAi(payload: AiAskRequestDto, user: { id: string }): Promise<AiSelfHostedAskAiResponse> {
		const prompt = this.buildAskAiPrompt(payload);
		
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify({
				model: this.model,
				messages: [
					{
						role: 'system',
						content: 'You are an AI assistant for n8n, a workflow automation platform. Help users with their workflow automation questions and provide accurate, helpful responses.',
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				stream: false,
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return {
			answer: data.choices[0]?.message?.content || 'No response generated',
		};
	}

	async generateAiCreditsCredentials(user: IUser): Promise<AiSelfHostedCredentials> {
		// For self-hosted, we return the user's configured API key
		return {
			apiKey: this.apiKey,
			url: this.baseUrl,
		};
	}

	private convertPayloadToMessages(payload: AiChatRequestDto): Array<{ role: string; content: string }> {
		// Convert the payload to OpenAI-compatible messages format
		const messages: Array<{ role: string; content: string }> = [];
		
		// Add system message
		messages.push({
			role: 'system',
			content: 'You are an AI assistant for n8n, a workflow automation platform. Help users with their workflow automation questions and provide accurate, helpful responses.',
		});

		// Extract user message from payload
		if (payload.payload && typeof payload.payload === 'object') {
			const userMessage = (payload.payload as any).message || (payload.payload as any).question || JSON.stringify(payload.payload);
			messages.push({
				role: 'user',
				content: userMessage,
			});
		}

		return messages;
	}

	private buildAskAiPrompt(payload: AiAskRequestDto): string {
		let prompt = `Question: ${payload.question}\n\n`;
		
		if (payload.context) {
			prompt += `Context:\n`;
			if (payload.context.schema) {
				prompt += `Available nodes and their schemas:\n`;
				for (const node of payload.context.schema) {
					prompt += `- ${node.nodeName}: ${JSON.stringify(node.schema)}\n`;
				}
			}
			
			if (payload.context.inputSchema) {
				prompt += `Input schema for ${payload.context.inputSchema.nodeName}: ${JSON.stringify(payload.context.inputSchema.schema)}\n`;
			}
		}
		
		prompt += `\nFor node: ${payload.forNode}\n\n`;
		prompt += `Please provide a helpful answer for this n8n workflow automation question.`;
		
		return prompt;
	}
}