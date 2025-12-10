const axios = require('axios');
const logger = require('../utils/logger');

/**
 * ScrapeCreators API Service
 * Searches multiple platforms using ScrapeCreators API
 */
class ScrapeCreatorsService {
  static apiKey = process.env.SCRAPECREATORS_API_KEY;
  static baseUrl = 'https://api.scrapecreators.com/v1';
  static timeout = 30000; // 30 seconds

  /**
   * Search posts across all platforms
   */
  static async searchPosts(query, platforms = ['reddit', 'youtube', 'tiktok', 'instagram', 'pinterest'], language = 'en', timeFilter = 'week', maxResults = 50) {
    const startTime = Date.now();
    logger.info(`🔍 ScrapeCreators search for: "${query}" on platforms: ${platforms.join(', ')}`);

    if (!this.apiKey) {
      logger.error('❌ ScrapeCreators API key not configured!');
      throw new Error('ScrapeCreators API key not configured');
    }

    try {
      const allPosts = [];

      // Search each platform in parallel
      const platformPromises = platforms.map(async (platform) => {
        try {
          const posts = await this.searchPlatform(platform, query, maxResults);
          return posts.map(post => ({ ...post, platform }));
        } catch (error) {
          logger.error(`❌ Error searching ${platform}:`, error.message);
          return [];
        }
      });

      const results = await Promise.all(platformPromises);
      results.forEach(posts => allPosts.push(...posts));

      const duration = Date.now() - startTime;
      logger.info(`✅ ScrapeCreators search completed: ${allPosts.length} posts in ${duration}ms`);

      return allPosts.sort((a, b) => (b.engagement || 0) - (a.engagement || 0));

    } catch (error) {
      logger.error('ScrapeCreators search error:', error);
      return [];
    }
  }

  /**
   * Search Ads across platforms
   */
  static async searchAds(query, platforms = ['facebook', 'linkedin', 'google'], maxResults = 20) {
    const startTime = Date.now();
    logger.info(`🔍 Searching Ads for: "${query}" on: ${platforms.join(', ')}`);

    const allAds = [];
    const headers = { 'x-api-key': this.apiKey };

    const adPromises = platforms.map(async (platform) => {
      try {
        let ads = [];
        switch (platform) {
          case 'facebook':
            ads = await this.searchFacebookAds(query, maxResults, headers);
            break;
          case 'linkedin':
            ads = await this.searchLinkedInAds(query, maxResults, headers);
            break;
          case 'google':
            ads = await this.searchGoogleAds(query, maxResults, headers);
            break;
        }
        return ads.map(ad => ({ ...ad, platform, type: 'ad' }));
      } catch (error) {
        logger.error(`❌ Error searching ${platform} ads:`, error.message);
        return [];
      }
    });

    const results = await Promise.all(adPromises);
    results.forEach(ads => allAds.push(...ads));

    logger.info(`✅ Ads search completed: ${allAds.length} ads found`);
    return allAds;
  }

  /**
   * Search a specific platform
   */
  static async searchPlatform(platform, query, maxResults) {
    const headers = { 'x-api-key': this.apiKey };

    switch (platform.toLowerCase()) {
      case 'reddit':
        return this.searchReddit(query, maxResults, headers);
      case 'youtube':
        return this.searchYouTube(query, maxResults, headers);
      case 'threads':
        return this.searchThreads(query, maxResults, headers);
      case 'tiktok':
        return this.searchTikTok(query, maxResults, headers);
      case 'instagram':
        return this.searchInstagram(query, maxResults, headers);
      case 'pinterest':
        return this.searchPinterest(query, maxResults, headers);
      case 'google':
        return this.searchGoogle(query, maxResults, headers);
      default:
        logger.warn(`⚠️ Unknown platform: ${platform}`);
        return [];
    }
  }

  // --- Content Search Methods ---

  static async searchReddit(query, maxResults, headers) {
    try {
      const response = await axios.get(`${this.baseUrl}/reddit/search`, {
        headers,
        params: { query, limit: maxResults },
        timeout: this.timeout
      });
      const posts = this.extractPosts(response.data);
      return posts.map(p => this.formatPost(p, 'reddit'));
    } catch (error) {
      this.logApiError('Reddit', error);
      return [];
    }
  }

  static async searchYouTube(query, maxResults, headers) {
    try {
      const response = await axios.get(`${this.baseUrl}/youtube/search`, {
        headers,
        params: { query, limit: maxResults },
        timeout: this.timeout
      });
      const videos = this.extractPosts(response.data);
      return videos.map(v => this.formatPost(v, 'youtube'));
    } catch (error) {
      this.logApiError('YouTube', error);
      return [];
    }
  }

  static async searchThreads(query, maxResults, headers) {
    try {
      const response = await axios.get(`${this.baseUrl}/threads/search`, {
        headers,
        params: { query, limit: maxResults },
        timeout: this.timeout
      });
      const posts = this.extractPosts(response.data);
      return posts.map(p => this.formatPost(p, 'threads'));
    } catch (error) {
      this.logApiError('Threads', error);
      return [];
    }
  }

  static async searchTikTok(query, maxResults, headers) {
    try {
      const response = await axios.get(`${this.baseUrl}/tiktok/search/keyword`, {
        headers,
        params: { query, limit: maxResults },
        timeout: this.timeout
      });
      const videos = this.extractPosts(response.data);
      return videos.map(v => this.formatPost(v, 'tiktok'));
    } catch (error) {
      this.logApiError('TikTok', error);
      return [];
    }
  }

  static async searchInstagram(query, maxResults, headers) {
    try {
      const response = await axios.get(`${this.baseUrl}/instagram/reels/search`, {
        headers,
        params: { query, limit: maxResults },
        timeout: this.timeout
      });
      const reels = this.extractPosts(response.data);
      return reels.map(r => this.formatPost(r, 'instagram'));
    } catch (error) {
      this.logApiError('Instagram', error);
      return [];
    }
  }

  static async searchPinterest(query, maxResults, headers) {
    try {
      const response = await axios.get(`${this.baseUrl}/pinterest/search`, {
        headers,
        params: { query, limit: maxResults },
        timeout: this.timeout
      });
      const pins = this.extractPosts(response.data);
      return pins.map(p => this.formatPost(p, 'pinterest'));
    } catch (error) {
      this.logApiError('Pinterest', error);
      return [];
    }
  }

  static async searchGoogle(query, maxResults, headers) {
    try {
      const response = await axios.get(`${this.baseUrl}/google/search`, {
        headers,
        params: { query, limit: maxResults },
        timeout: this.timeout
      });
      const results = this.extractPosts(response.data);
      return results.map(r => this.formatPost(r, 'google'));
    } catch (error) {
      this.logApiError('Google', error);
      return [];
    }
  }

  // --- Ad Search Methods ---

  static async searchFacebookAds(query, maxResults, headers) {
    try {
      const response = await axios.get(`${this.baseUrl}/facebook/adLibrary/search/ads`, {
        headers,
        params: { query, limit: maxResults },
        timeout: this.timeout
      });
      const ads = this.extractPosts(response.data);
      return ads.map(ad => this.formatAd(ad, 'facebook'));
    } catch (error) {
      this.logApiError('Facebook Ads', error);
      return [];
    }
  }

  static async searchLinkedInAds(query, maxResults, headers) {
    try {
      const response = await axios.get(`${this.baseUrl}/linkedin/ads/search`, {
        headers,
        params: { query, limit: maxResults },
        timeout: this.timeout
      });
      const ads = this.extractPosts(response.data);
      return ads.map(ad => this.formatAd(ad, 'linkedin'));
    } catch (error) {
      this.logApiError('LinkedIn Ads', error);
      return [];
    }
  }

  static async searchGoogleAds(query, maxResults, headers) {
    try {
      const response = await axios.get(`${this.baseUrl}/google/adLibrary/advertisers/search`, {
        headers,
        params: { query, limit: maxResults },
        timeout: this.timeout
      });
      const ads = this.extractPosts(response.data);
      return ads.map(ad => this.formatAd(ad, 'google'));
    } catch (error) {
      this.logApiError('Google Ads', error);
      return [];
    }
  }

  // --- Helpers ---

  static extractPosts(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.data?.posts || data.data?.videos || data.data?.items || 
           data.data?.results || data.posts || data.videos || data.results || [];
  }

  static logApiError(platform, error) {
    logger.error(`${platform} search error:`, error.message);
  }

  static formatPost(item, platform) {
    // Generic formatter for all platforms
    const engagement = (item.likes || item.like_count || 0) + 
                      (item.comments || item.comment_count || 0) + 
                      (item.shares || item.share_count || 0) +
                      (item.views || item.view_count || 0) * 0.01;

    return {
      id: item.id || item.post_id || item.video_id || `${platform}_${Date.now()}_${Math.random()}`,
      content: item.title || item.text || item.content || item.description || item.caption || '',
      source: item.author || item.username || item.channel || item.subreddit || platform,
      engagement: Math.round(engagement),
      timestamp: item.created_at || item.published_at || item.timestamp || new Date().toISOString(),
      url: item.url || item.permalink || item.post_url || '#',
      author: item.author || item.username || 'Unknown',
      platform: platform,
      thumbnail: item.thumbnail || item.cover_image || item.image_url || ''
    };
  }

  static formatAd(ad, platform) {
    return {
      id: ad.id || `${platform}_ad_${Date.now()}`,
      content: ad.ad_creative_body || ad.title || ad.description || '',
      source: ad.page_name || ad.advertiser_name || platform,
      engagement: 0, // Ads usually don't show engagement publicly
      timestamp: ad.start_date || new Date().toISOString(),
      url: ad.ad_snapshot_url || ad.url || '#',
      author: ad.page_name || ad.advertiser_name || 'Unknown',
      platform: platform,
      type: 'ad',
      thumbnail: ad.image_url || ad.thumbnail || ''
    };
  }
}

module.exports = ScrapeCreatorsService;
