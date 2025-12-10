const axios = require('axios');
const logger = require('../utils/logger');

/**
 * ScrapeCreators API Service
 * Searches Reddit, YouTube, and Threads using ScrapeCreators API
 * 
 * API Format:
 * - GET requests with x-api-key header
 * - Platform-specific endpoints: /v1/{platform}/search
 * - Query param: ?query=...
 */
class ScrapeCreatorsService {
  static apiKey = process.env.SCRAPECREATORS_API_KEY;
  static baseUrl = 'https://api.scrapecreators.com/v1';
  static timeout = 30000; // 30 seconds

  /**
   * Search posts across all platforms using ScrapeCreators API
   * @param {string} query - Search query
   * @param {string[]} platforms - Array of platforms: 'reddit', 'youtube', 'threads'
   * @param {string} language - Language code (e.g., 'en')
   * @param {string} timeFilter - Time filter (hour, day, week, month, year)
   * @param {number} maxResults - Maximum number of results per platform
   * @returns {Promise<Array>} Array of formatted posts with platform field
   */
  static async searchPosts(query, platforms = ['reddit', 'youtube', 'threads'], language = 'en', timeFilter = 'week', maxResults = 50) {
    const startTime = Date.now();
    logger.info(`🔍 ScrapeCreators search for: "${query}" on platforms: ${platforms.join(', ')}`);

    if (!this.apiKey) {
      logger.error('❌ ScrapeCreators API key not configured! Please set SCRAPECREATORS_API_KEY environment variable.');
      throw new Error('ScrapeCreators API key not configured');
    }

    try {
      const allPosts = [];

      // Search each platform in parallel
      const platformPromises = platforms.map(async (platform) => {
        try {
          const posts = await this.searchPlatform(platform, query, maxResults);
          // Add platform identifier to each post
          return posts.map(post => ({
            ...post,
            platform: platform
          }));
        } catch (error) {
          logger.error(`❌ Error searching ${platform}:`, error.message);
          return [];
        }
      });

      const results = await Promise.all(platformPromises);
      results.forEach(posts => allPosts.push(...posts));

      const duration = Date.now() - startTime;
      logger.info(`✅ ScrapeCreators search completed: ${allPosts.length} posts in ${duration}ms`);

      // Sort by engagement
      return allPosts.sort((a, b) => (b.engagement || 0) - (a.engagement || 0));

    } catch (error) {
      logger.error('ScrapeCreators search error:', error);
      return [];
    }
  }

  /**
   * Search a specific platform
   */
  static async searchPlatform(platform, query, maxResults) {
    const headers = {
      'x-api-key': this.apiKey
    };

    switch (platform.toLowerCase()) {
      case 'reddit':
        return this.searchReddit(query, maxResults, headers);
      case 'youtube':
        return this.searchYouTube(query, maxResults, headers);
      case 'threads':
        return this.searchThreads(query, maxResults, headers);
      case 'x':
      case 'twitter':
        // Twitter/X search not available in ScrapeCreators API
        // Only user-tweets and tweet details endpoints exist
        logger.warn('⚠️ Twitter/X search endpoint not available in ScrapeCreators API - skipping');
        return [];
      case 'linkedin':
        // LinkedIn search not available in ScrapeCreators API
        // Only post, profile, and company endpoints exist
        logger.warn('⚠️ LinkedIn search endpoint not available in ScrapeCreators API - skipping');
        return [];
      default:
        logger.warn(`⚠️ Unknown platform: ${platform}`);
        return [];
    }
  }

  /**
   * Search Reddit using ScrapeCreators API
   * Endpoint: GET /v1/reddit/search?query=...
   */
  static async searchReddit(query, maxResults, headers) {
    try {
      logger.debug(`📡 Searching Reddit for: "${query}"`);

      const response = await axios.get(`${this.baseUrl}/reddit/search`, {
        headers,
        params: {
          query: query,
          limit: maxResults
        },
        timeout: this.timeout
      });

      logger.debug('Reddit API response:', JSON.stringify(response.data).substring(0, 500));

      // Handle various response formats
      const posts = this.extractPostsFromResponse(response.data, 'reddit');
      
      if (!Array.isArray(posts) || posts.length === 0) {
        logger.warn('No posts found from Reddit');
        return [];
      }

      const formatted = posts.map(post => this.formatRedditPost(post));
      logger.info(`✅ Found ${formatted.length} posts from Reddit`);
      return formatted;

    } catch (error) {
      this.logApiError('Reddit', error);
      return [];
    }
  }

  /**
   * Search YouTube using ScrapeCreators API
   * Endpoint: GET /v1/youtube/search?query=...
   */
  static async searchYouTube(query, maxResults, headers) {
    try {
      logger.debug(`📡 Searching YouTube for: "${query}"`);

      const response = await axios.get(`${this.baseUrl}/youtube/search`, {
        headers,
        params: {
          query: query,
          limit: maxResults
        },
        timeout: this.timeout
      });

      logger.debug('YouTube API response:', JSON.stringify(response.data).substring(0, 500));

      // Handle various response formats
      const videos = this.extractPostsFromResponse(response.data, 'youtube');
      
      if (!Array.isArray(videos) || videos.length === 0) {
        logger.warn('No videos found from YouTube');
        return [];
      }

      const formatted = videos.map(video => this.formatYouTubePost(video));
      logger.info(`✅ Found ${formatted.length} videos from YouTube`);
      return formatted;

    } catch (error) {
      this.logApiError('YouTube', error);
      return [];
    }
  }

  /**
   * Search Threads using ScrapeCreators API
   * Endpoint: GET /v1/threads/search?query=...
   */
  static async searchThreads(query, maxResults, headers) {
    try {
      logger.debug(`📡 Searching Threads for: "${query}"`);

      const response = await axios.get(`${this.baseUrl}/threads/search`, {
        headers,
        params: {
          query: query,
          limit: maxResults
        },
        timeout: this.timeout
      });

      logger.debug('Threads API response:', JSON.stringify(response.data).substring(0, 500));

      // Handle various response formats
      const posts = this.extractPostsFromResponse(response.data, 'threads');
      
      if (!Array.isArray(posts) || posts.length === 0) {
        logger.warn('No posts found from Threads');
        return [];
      }

      const formatted = posts.map(post => this.formatThreadsPost(post));
      logger.info(`✅ Found ${formatted.length} posts from Threads`);
      return formatted;

    } catch (error) {
      this.logApiError('Threads', error);
      return [];
    }
  }

  /**
   * Extract posts array from various response formats
   */
  static extractPostsFromResponse(data, platform) {
    if (!data) return [];

    // Try common response structures
    if (Array.isArray(data)) {
      return data;
    }
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    if (data.posts && Array.isArray(data.posts)) {
      return data.posts;
    }
    if (data.results && Array.isArray(data.results)) {
      return data.results;
    }
    if (data.videos && Array.isArray(data.videos)) {
      return data.videos;
    }
    if (data.items && Array.isArray(data.items)) {
      return data.items;
    }
    // Nested data structures
    if (data.data?.posts && Array.isArray(data.data.posts)) {
      return data.data.posts;
    }
    if (data.data?.results && Array.isArray(data.data.results)) {
      return data.data.results;
    }
    if (data.data?.videos && Array.isArray(data.data.videos)) {
      return data.data.videos;
    }
    if (data.data?.items && Array.isArray(data.data.items)) {
      return data.data.items;
    }

    logger.warn(`Could not extract posts from ${platform} response. Structure:`, Object.keys(data));
    return [];
  }

  /**
   * Log API error with details
   */
  static logApiError(platform, error) {
    if (error.response) {
      logger.error(`${platform} API error:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: JSON.stringify(error.response.data).substring(0, 200)
      });
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      logger.error(`${platform} API connection error:`, error.message);
    } else {
      logger.error(`${platform} search error:`, error.message);
    }
  }

  /**
   * Format Reddit post to standard structure
   */
  static formatRedditPost(post) {
    // Calculate engagement (sum of interactions)
    const engagement = (post.score || post.ups || 0) + 
                      (post.num_comments || post.comments || 0);

    return {
      id: post.id || post.name || `reddit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: post.title || post.text || post.selftext || post.body || '',
      source: post.subreddit ? `r/${post.subreddit}` : (post.subreddit_name_prefixed || 'Reddit'),
      engagement: Math.round(engagement),
      timestamp: post.created_utc 
        ? new Date(post.created_utc * 1000).toISOString() 
        : (post.created || post.timestamp || new Date().toISOString()),
      url: post.url || post.permalink || (post.id ? `https://reddit.com/comments/${post.id}` : '#'),
      author: post.author || post.author_name || 'Unknown'
    };
  }

  /**
   * Format YouTube video to standard structure
   */
  static formatYouTubePost(video) {
    // Calculate engagement
    const views = parseInt(video.viewCount || video.views || video.view_count || 0);
    const likes = parseInt(video.likeCount || video.likes || video.like_count || 0);
    const comments = parseInt(video.commentCount || video.comments || video.comment_count || 0);
    const engagement = views * 0.01 + likes + comments; // Weight views less

    const videoId = video.id || video.videoId || video.video_id;

    return {
      id: videoId || `youtube_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: video.title || video.snippet?.title || video.description || '',
      source: video.channelTitle || video.channel || video.channel_title || video.author || 'YouTube',
      engagement: Math.round(engagement),
      timestamp: video.publishedAt || video.published_at || video.upload_date || new Date().toISOString(),
      url: video.url || (videoId ? `https://youtube.com/watch?v=${videoId}` : '#'),
      author: video.channelTitle || video.channel || video.channel_title || video.author || 'Unknown'
    };
  }

  /**
   * Format Threads post to standard structure
   */
  static formatThreadsPost(post) {
    // Calculate engagement
    const engagement = (post.likes || post.like_count || 0) + 
                      (post.replies || post.comments || post.reply_count || 0) + 
                      (post.reposts || post.repost_count || post.shares || 0);

    return {
      id: post.id || post.post_id || `threads_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: post.text || post.content || post.caption || post.body || '',
      source: post.username ? `@${post.username}` : (post.author || 'Threads'),
      engagement: Math.round(engagement),
      timestamp: post.created_at || post.timestamp || post.posted_at || new Date().toISOString(),
      url: post.url || post.permalink || post.post_url || '#',
      author: post.username || post.author || post.user || 'Unknown'
    };
  }
}

module.exports = ScrapeCreatorsService;
