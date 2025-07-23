import OpenAI from 'openai';

/**
 * OpenAI configuration and client setup.
 *
 * @author WikiAI Team
 * @description Configures OpenAI client with API key and organization settings.
 */

/**
 * Check if OpenAI is properly configured.
 */
export const isOpenAIConfigured = () => {
  return !!process.env.OPENAI_API_KEY;
};

/**
 * Get OpenAI client instance.
 * Only creates the client when needed and properly configured.
 */
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
  }

  const openaiConfig = {
    apiKey: process.env.OPENAI_API_KEY
  };

  // Add organization if provided
  if (process.env.OPENAI_ORGANIZATION) {
    openaiConfig.organization = process.env.OPENAI_ORGANIZATION;
  }

  return new OpenAI(openaiConfig);
};

/**
 * Configured OpenAI client instance (lazy-loaded).
 */
let openai = null;
const getOpenAI = () => {
  if (!openai) {
    openai = getOpenAIClient();
  }
  return openai;
};

/**
 * Available AI models for document generation and improvement.
 */
export const AVAILABLE_MODELS = {
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    description: 'Most capable model, best for complex document generation',
    maxTokens: 4096,
    cost: 'high'
  },
  'gpt-4': {
    name: 'GPT-4',
    description: 'High-quality model for professional document creation',
    maxTokens: 4096,
    cost: 'high'
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient model for quick document tasks',
    maxTokens: 4096,
    cost: 'low'
  }
};

/**
 * Default model configuration.
 */
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

/**
 * Maximum tokens for different operations.
 */
export const TOKEN_LIMITS = {
  generation: 4000,
  improvement: 4000,
  prompt: 2000
};

export default getOpenAI;
