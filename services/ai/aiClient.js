const logger = require('../../utils/logger');
const GroqClient = require('./groqClient');
const OllamaClient = require('./ollamaClient');

/**
 * Unified AI Client
 * Primary: Groq API with Llama 3.1 70B (fast, free tier)
 * Backup: Ollama with Llama 3.1 8B (self-hosted, redundant)
 */
class AIClient {
  /**
   * Call AI service with automatic fallback
   * @param {string} prompt - The prompt to send
   * @param {object} options - Options for the call
   * @param {number} options.temperature - Temperature (0-1)
   * @param {number} options.max_tokens - Max tokens to generate
   * @param {boolean} options.forceOllama - Force use of Ollama (skip Groq)
   * @returns {Promise<string>} AI response text
   */
  static async call(prompt, options = {}) {
    // If forceOllama is set, skip Groq
    if (options.forceOllama) {
      logger.info('🔄 Using Ollama (forced)');
      return OllamaClient.call(prompt, options);
    }

    // Try Groq first (primary)
    if (GroqClient.isAvailable()) {
      try {
        return await GroqClient.call(prompt, options);
      } catch (groqError) {
        logger.warn(`⚠️ Groq API failed, falling back to Ollama: ${groqError.message}`);
        // Fall through to Ollama
      }
    } else {
      logger.info('🔄 Groq not available, using Ollama');
    }

    // Fallback to Ollama (backup)
    try {
      return await OllamaClient.call(prompt, options);
    } catch (ollamaError) {
      logger.error(`❌ Both Groq and Ollama failed. Groq error: ${groqError?.message || 'N/A'}, Ollama error: ${ollamaError.message}`);
      throw new Error(`All AI services unavailable. Last error: ${ollamaError.message}`);
    }
  }

  /**
   * Get current AI provider status
   * @returns {object} Status of both providers
   */
  static getStatus() {
    return {
      groq: {
        available: GroqClient.isAvailable(),
        model: GroqClient.model,
        provider: 'Groq API (Primary)'
      },
      ollama: {
        available: OllamaClient.isAvailable(),
        model: OllamaClient.model,
        provider: 'Ollama (Backup)'
      }
    };
  }
}

module.exports = AIClient;

