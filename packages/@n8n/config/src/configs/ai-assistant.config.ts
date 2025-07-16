import { Config, Env } from '../decorators';

@Config
export class AiAssistantConfig {
	/** Base URL of the AI assistant service */
	@Env('N8N_AI_ASSISTANT_BASE_URL')
	baseUrl: string = '';

	/** OpenRouter API key for self-hosted AI assistant */
	@Env('N8N_AI_ASSISTANT_OPENROUTER_API_KEY')
	openRouterApiKey: string = '';

	/** OpenAI API key for self-hosted AI assistant */
	@Env('N8N_AI_ASSISTANT_OPENAI_API_KEY')
	openAiApiKey: string = '';

	/** OpenRouter model name for self-hosted AI assistant */
	@Env('N8N_AI_ASSISTANT_OPENROUTER_MODEL')
	openRouterModel: string = 'meta-llama/llama-3.1-8b-instruct:free';

	/** OpenAI model name for self-hosted AI assistant */
	@Env('N8N_AI_ASSISTANT_OPENAI_MODEL')
	openAiModel: string = 'gpt-4o-mini';

	/** Self-hosted AI assistant enabled flag */
	@Env('N8N_AI_ASSISTANT_SELF_HOSTED_ENABLED')
	selfHostedEnabled: boolean = false;
}
