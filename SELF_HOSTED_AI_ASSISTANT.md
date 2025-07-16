# Self-Hosted AI Assistant for n8n

This document explains how to enable and configure the AI Assistant feature in self-hosted n8n installations using your own OpenRouter or OpenAI API keys.

## Overview

The AI Assistant feature in n8n was previously only available to cloud users with enterprise licenses. This implementation allows self-hosted n8n installations to use the AI Assistant functionality by providing their own API keys from OpenRouter or OpenAI.

## Features

- **Chat Assistant**: Interactive chat interface for workflow automation help
- **Ask AI**: Get AI-powered suggestions and answers within the node editor
- **Code Generation**: AI-assisted code generation for workflow nodes
- **API Compatibility**: Works with both OpenRouter and OpenAI APIs
- **Enterprise License Preserved**: Maintains existing enterprise license validation for cloud users

## Configuration

### Environment Variables

To enable the self-hosted AI Assistant, set the following environment variables:

#### Required
```bash
# Enable self-hosted AI Assistant
N8N_AI_ASSISTANT_SELF_HOSTED_ENABLED=true

# Choose one of the following API providers:

# Option 1: OpenRouter (recommended for cost-effectiveness)
N8N_AI_ASSISTANT_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Option 2: OpenAI
N8N_AI_ASSISTANT_OPENAI_API_KEY=your_openai_api_key_here
```

#### Optional Model Configuration
```bash
# OpenRouter model (default: meta-llama/llama-3.1-8b-instruct:free)
N8N_AI_ASSISTANT_OPENROUTER_MODEL=meta-llama/llama-3.1-405b-instruct:free

# OpenAI model (default: gpt-4o-mini)
N8N_AI_ASSISTANT_OPENAI_MODEL=gpt-4o
```

### API Provider Setup

#### OpenRouter (Recommended)
1. Create an account at [OpenRouter](https://openrouter.ai/)
2. Generate an API key from your account settings
3. Set the `N8N_AI_ASSISTANT_OPENROUTER_API_KEY` environment variable
4. Optionally configure the model using `N8N_AI_ASSISTANT_OPENROUTER_MODEL`

**Available Models:**
- `meta-llama/llama-3.1-8b-instruct:free` (Free tier)
- `meta-llama/llama-3.1-70b-instruct:free` (Free tier)
- `meta-llama/llama-3.1-405b-instruct:free` (Free tier)
- `openai/gpt-4o-mini` (Paid)
- `openai/gpt-4o` (Paid)

#### OpenAI
1. Create an account at [OpenAI](https://openai.com/)
2. Generate an API key from your account settings
3. Set the `N8N_AI_ASSISTANT_OPENAI_API_KEY` environment variable
4. Optionally configure the model using `N8N_AI_ASSISTANT_OPENAI_MODEL`

**Available Models:**
- `gpt-4o-mini` (Default, cost-effective)
- `gpt-4o` (More capable, higher cost)
- `gpt-4-turbo`
- `gpt-3.5-turbo`

## Backend API Documentation

### Endpoints

The AI Assistant exposes the following REST endpoints:

#### `POST /rest/ai/chat`
Interactive chat with the AI assistant.

**Request Body:**
```json
{
  "payload": {
    "message": "How do I create a webhook in n8n?",
    "sessionId": "optional-session-id"
  },
  "sessionId": "session-123"
}
```

**Response:**
Streaming response with JSON-lines format containing chat messages.

#### `POST /rest/ai/ask-ai`
Get AI-powered help for specific workflow nodes.

**Request Body:**
```json
{
  "question": "How do I configure the HTTP Request node?",
  "context": {
    "schema": [
      {
        "nodeName": "HTTP Request",
        "schema": {
          "type": "object",
          "path": "/nodes/HttpRequest",
          "value": "node-schema-data"
        }
      }
    ],
    "inputSchema": {
      "nodeName": "HTTP Request",
      "schema": {
        "type": "object",
        "path": "/nodes/HttpRequest",
        "value": "input-schema-data"
      }
    },
    "pushRef": "push-reference",
    "ndvPushRef": "ndv-push-reference"
  },
  "forNode": "HTTP Request"
}
```

**Response:**
```json
{
  "answer": "To configure the HTTP Request node, you need to..."
}
```

#### `POST /rest/ai/chat/apply-suggestion`
Apply AI-generated suggestions to workflows.

**Request Body:**
```json
{
  "sessionId": "session-123",
  "suggestionId": "suggestion-456"
}
```

**Response:**
```json
{
  "sessionId": "session-123",
  "suggestionId": "suggestion-456",
  "applied": true
}
```

#### `POST /rest/ai/free-credits`
Generate AI credits credentials for self-hosted installations.

**Request Body:**
```json
{
  "projectId": "optional-project-id"
}
```

**Response:**
```json
{
  "id": "credential-id",
  "name": "AI Credits (Free)",
  "type": "openAiApi",
  "data": {
    "apiKey": "your-configured-api-key",
    "url": "https://api.openai.com/v1"
  }
}
```

### Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid payload)
- `401` - Unauthorized (invalid API key)
- `413` - Content Too Large (request too large)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Implementation Details

### Architecture

The self-hosted AI Assistant is implemented with the following components:

1. **Configuration Layer**: `AiAssistantConfig` class handles environment variables
2. **Service Layer**: `AiService` manages both cloud and self-hosted clients
3. **Client Layer**: `OpenRouterClient` and `OpenAIClient` handle API communication
4. **Controller Layer**: `AiController` exposes REST endpoints
5. **Frontend Integration**: Settings service enables UI features

### Priority Order

The system prioritizes AI providers in the following order:
1. **Licensed Cloud Client** (if enterprise license is available)
2. **OpenRouter Client** (if API key is configured)
3. **OpenAI Client** (if API key is configured)

### Security Considerations

- API keys are stored as environment variables and never exposed to clients
- All API requests include appropriate security headers
- Rate limiting is applied to prevent abuse
- Input validation is performed on all requests

## Troubleshooting

### Common Issues

1. **AI Assistant not appearing in UI**
   - Ensure `N8N_AI_ASSISTANT_SELF_HOSTED_ENABLED=true` is set
   - Verify at least one API key is configured correctly
   - Restart n8n after changing environment variables

2. **API errors (401 Unauthorized)**
   - Check that your API key is valid and has sufficient quota
   - Verify the API key format is correct

3. **Rate limiting errors (429)**
   - Implement request throttling in your application
   - Consider upgrading to a paid tier with higher rate limits

4. **Model not found errors**
   - Verify the model name is correct for your chosen provider
   - Check if the model is available in your region/account

### Testing Your Setup

You can test your configuration by making a direct API request:

```bash
# Test OpenRouter
curl -X POST "http://localhost:5678/rest/ai/ask-ai" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do I create a simple workflow?",
    "context": {"schema": [], "inputSchema": {"nodeName": "Test", "schema": {"type": "object", "path": "/test", "value": "test"}}, "pushRef": "test", "ndvPushRef": "test"},
    "forNode": "Manual Trigger"
  }'
```

## Cost Considerations

### OpenRouter
- Free tier models available (llama-3.1-8b-instruct:free)
- Pay-per-use pricing for premium models
- Generally more cost-effective than OpenAI

### OpenAI
- No free tier, all requests are charged
- Higher cost but potentially better quality responses
- GPT-4o-mini is the most cost-effective option

## Support

For issues with the self-hosted AI Assistant:

1. Check the n8n server logs for error messages
2. Verify your API key and configuration
3. Test with a simple request to isolate the issue
4. Report bugs to the n8n GitHub repository

## Future Enhancements

Potential future improvements:
- Support for additional AI providers (Anthropic, Cohere, etc.)
- Custom model fine-tuning integration
- Advanced prompt customization
- Usage analytics and monitoring
- Caching layer for improved performance