const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Groq API Client
 * Primary AI service using Llama 3.1 70B
 * Blazing fast (280 tokens/sec) with free tier: 14,400 requests/day
 */
class GroqClient {
  static apiKey = process.env.GROQ_API_KEY;
  static baseUrl = 'https://api.groq.com/openai/v1';
  static model = 'llama-3.1-70b-versatile'; // Llama 3.1 70B
  static timeout = 30000; // 30 seconds (Groq is fast)

  /**
   * Call Groq API with Llama 3.1 70B
   * @param {string} prompt - The prompt to send
   * @param {object} options - Options for the call
   * @param {number} options.temperature - Temperature (0-1)
   * @param {number} options.max_tokens - Max tokens to generate
   * @returns {Promise<string>} AI response text
   */
  static async call(prompt, options = {}) {
    if (!this.apiKey) {
      logger.warn('⚠️ Groq API key not configured, will fallback to Ollama');
      throw new Error('GROQ_API_KEY not configured');
    }

    try {
      logger.info(`🚀 Calling Groq API with Llama 3.1 70B`);
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: options.temperature || 0.3,
          max_tokens: options.max_tokens || 2000,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout,
          validateStatus: function (status) {
            return status < 500; // Don't throw for 4xx errors
          }
        }
      );

      if (response.status >= 400) {
        logger.error(`❌ Groq API returned error status ${response.status}:`, response.data);
        throw new Error(`Groq API error: ${response.status} - ${response.data?.error?.message || 'Unknown error'}`);
      }

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        logger.error('❌ Groq API returned invalid response:', response.data);
        throw new Error('Invalid response from Groq API');
      }

      const content = response.data.choices[0].message.content;
      logger.info(`✅ Groq API call successful (${content.length} chars)`);
      return content;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        logger.warn(`⚠️ Groq API timeout/connection error, will fallback to Ollama: ${error.message}`);
        throw error;
      } else if (error.response) {
        logger.error(`❌ Groq API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        throw new Error(`Groq API error: ${error.response.data?.error?.message || error.message}`);
      } else {
        logger.error('Groq API call failed:', error.message);
        throw error;
      }
    }
  }

  /**
   * Check if Groq API is available
   * @returns {boolean}
   */
  static isAvailable() {
    return !!this.apiKey;
  }
}

module.exports = GroqClient;

