const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Ollama API Client (Backup/Fallback)
 * Self-hosted Llama 3.1 8B on Railway for redundancy
 */
class OllamaClient {
  static baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  static model = 'llama3.1:8b';  // Llama 3.1 8B as backup
  static timeout = 120000; // 120 seconds

  /**
   * Call Ollama API with Llama 3.1 8B (backup model)
   * @param {string} prompt - The prompt to send
   * @param {object} options - Options for the call
   * @param {number} options.temperature - Temperature (0-1)
   * @param {number} options.max_tokens - Max tokens to generate
   * @returns {Promise<string>} AI response text
   */
  static async call(prompt, options = {}) {
    try {
      logger.info(`🔄 Calling Ollama (backup) at ${this.baseUrl} with model: ${this.model}`);
      
      const contextSize = 8192; // Llama 3.1 8B supports up to 8K context
      
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.3,
          max_tokens: options.max_tokens || 2000,
          num_ctx: contextSize
        }
      }, {
        timeout: this.timeout,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      if (response.status >= 400) {
        logger.error(`❌ Ollama API returned error status ${response.status}:`, response.data);
        throw new Error(`Ollama API error: ${response.status} - ${response.data?.error || 'Unknown error'}`);
      }

      if (!response.data || !response.data.response) {
        logger.error('❌ Ollama API returned invalid response:', response.data);
        throw new Error('Invalid response from Ollama API');
      }

      logger.info(`✅ Ollama API call successful (backup)`);
      return response.data.response;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logger.error(`❌ Cannot connect to Ollama at ${this.baseUrl}. Is Ollama running?`);
        throw new Error(`Ollama service unavailable at ${this.baseUrl}. Please check if Ollama is running.`);
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        logger.error(`❌ Ollama API call timed out after ${this.timeout}ms`);
        throw new Error(`AI model request timed out. The model may be overloaded or not loaded.`);
      } else if (error.response) {
        logger.error(`❌ Ollama API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        throw new Error(`AI model error: ${error.response.data?.error || error.message}`);
      } else {
        logger.error('Ollama API call failed:', error.message);
        throw error;
      }
    }
  }

  /**
   * Check if Ollama is available
   * @returns {boolean}
   */
  static isAvailable() {
    return true; // Assume available if baseUrl is set
  }
}

module.exports = OllamaClient;

