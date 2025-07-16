import type {
	AiApplySuggestionRequestDto,
	AiAskRequestDto,
	AiChatRequestDto,
} from '@n8n/api-types';
import { GlobalConfig } from '@n8n/config';
import { Service } from '@n8n/di';
import { AiAssistantClient } from '@n8n_io/ai-assistant-sdk';
import { assert, type IUser } from 'n8n-workflow';

import { N8N_VERSION } from '../constants';
import { License } from '../license';
import { OpenRouterClient, OpenAIClient, type AiSelfHostedClient } from './ai-self-hosted.service';

@Service()
export class AiService {
	private client: AiAssistantClient | undefined;
	private selfHostedClient: AiSelfHostedClient | undefined;
	private isUsingLicensedClient = false;

	constructor(
		private readonly licenseService: License,
		private readonly globalConfig: GlobalConfig,
	) {}

	async init() {
		const aiAssistantEnabled = this.licenseService.isAiAssistantEnabled();

		// Check if self-hosted mode is configured
		const selfHostedEnabled = this.globalConfig.aiAssistant.selfHostedEnabled;
		const openRouterKey = this.globalConfig.aiAssistant.openRouterApiKey;
		const openAiKey = this.globalConfig.aiAssistant.openAiApiKey;

		if (aiAssistantEnabled) {
			// Use licensed cloud client
			const licenseCert = await this.licenseService.loadCertStr();
			const consumerId = this.licenseService.getConsumerId();
			const baseUrl = this.globalConfig.aiAssistant.baseUrl;
			const logLevel = this.globalConfig.logging.level;

			this.client = new AiAssistantClient({
				licenseCert,
				consumerId,
				n8nVersion: N8N_VERSION,
				baseUrl,
				logLevel,
			});
			this.isUsingLicensedClient = true;
		} else if (selfHostedEnabled && (openRouterKey || openAiKey)) {
			// Use self-hosted client
			if (openRouterKey) {
				this.selfHostedClient = new OpenRouterClient(
					openRouterKey,
					this.globalConfig.aiAssistant.openRouterModel,
				);
			} else if (openAiKey) {
				this.selfHostedClient = new OpenAIClient(
					openAiKey,
					this.globalConfig.aiAssistant.openAiModel,
				);
			}
			this.isUsingLicensedClient = false;
		}
	}

	async chat(payload: AiChatRequestDto, user: IUser) {
		if (!this.client && !this.selfHostedClient) {
			await this.init();
		}

		if (this.isUsingLicensedClient) {
			assert(this.client, 'Licensed assistant client not setup');
			return await this.client.chat(payload, { id: user.id });
		} else {
			assert(this.selfHostedClient, 'Self-hosted assistant client not setup');
			return await this.selfHostedClient.chat(payload, { id: user.id });
		}
	}

	async applySuggestion(payload: AiApplySuggestionRequestDto, user: IUser) {
		if (!this.client && !this.selfHostedClient) {
			await this.init();
		}

		if (this.isUsingLicensedClient) {
			assert(this.client, 'Licensed assistant client not setup');
			return await this.client.applySuggestion(payload, { id: user.id });
		} else {
			assert(this.selfHostedClient, 'Self-hosted assistant client not setup');
			return await this.selfHostedClient.applySuggestion(payload, { id: user.id });
		}
	}

	async askAi(payload: AiAskRequestDto, user: IUser) {
		if (!this.client && !this.selfHostedClient) {
			await this.init();
		}

		if (this.isUsingLicensedClient) {
			assert(this.client, 'Licensed assistant client not setup');
			return await this.client.askAi(payload, { id: user.id });
		} else {
			assert(this.selfHostedClient, 'Self-hosted assistant client not setup');
			return await this.selfHostedClient.askAi(payload, { id: user.id });
		}
	}

	async createFreeAiCredits(user: IUser) {
		if (!this.client && !this.selfHostedClient) {
			await this.init();
		}

		if (this.isUsingLicensedClient) {
			assert(this.client, 'Licensed assistant client not setup');
			return await this.client.generateAiCreditsCredentials(user);
		} else {
			assert(this.selfHostedClient, 'Self-hosted assistant client not setup');
			return await this.selfHostedClient.generateAiCreditsCredentials(user);
		}
	}
}
