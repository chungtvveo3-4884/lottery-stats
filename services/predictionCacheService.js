/**
 * Prediction Cache Service
 * Cache kết quả tính toán để không phải tính lại mỗi lần truy cập
 * Chỉ cập nhật khi có data mới (1-2 lần/ngày)
 */

const fs = require('fs').promises;
const path = require('path');

const CACHE_PATH = path.join(__dirname, '..', 'data', 'prediction-cache.json');

class PredictionCacheService {
    constructor() {
        this.cache = {
            unified: null,
            advanced: null,
            hybrid: null,
            exclusion: null,
            lastUpdated: null,
            dataDate: null  // Ngày của data nguồn
        };
        this.initialized = false;
    }

    /**
     * Load cache từ file
     */
    async loadCache() {
        try {
            const data = await fs.readFile(CACHE_PATH, 'utf-8');
            this.cache = JSON.parse(data);
            this.initialized = true;
            console.log(`[Cache] Loaded prediction cache from ${this.cache.lastUpdated}`);
            return true;
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('[Cache] Error loading cache:', error.message);
            }
            return false;
        }
    }

    /**
     * Lưu cache vào file
     */
    async saveCache() {
        try {
            this.cache.lastUpdated = new Date().toISOString();
            await fs.writeFile(CACHE_PATH, JSON.stringify(this.cache, null, 2));
            console.log('[Cache] Saved prediction cache');
        } catch (error) {
            console.error('[Cache] Error saving cache:', error.message);
        }
    }

    /**
     * Kiểm tra cache có hợp lệ không
     * @param {string} currentDataDate - Ngày của data hiện tại
     */
    isValid(currentDataDate) {
        if (!this.cache.dataDate || !this.cache.lastUpdated) return false;
        return this.cache.dataDate === currentDataDate;
    }

    /**
     * Cập nhật cache cho một phương pháp
     */
    async updateMethod(method, data, dataDate) {
        this.cache[method] = data;
        this.cache.dataDate = dataDate;
        await this.saveCache();
    }

    /**
     * Cập nhật tất cả cache cùng lúc
     */
    async updateAll(predictions, dataDate) {
        this.cache = {
            ...predictions,
            dataDate: dataDate,
            lastUpdated: new Date().toISOString()
        };
        await this.saveCache();
    }

    /**
     * Lấy cache cho một phương pháp
     */
    getMethod(method) {
        return this.cache[method];
    }

    /**
     * Lấy tất cả cache
     */
    getAll() {
        return {
            unified: this.cache.unified,
            advanced: this.cache.advanced,
            hybrid: this.cache.hybrid,
            exclusion: this.cache.exclusion,
            lastUpdated: this.cache.lastUpdated,
            dataDate: this.cache.dataDate
        };
    }

    /**
     * Xóa cache
     */
    async clearCache() {
        this.cache = {
            unified: null,
            advanced: null,
            hybrid: null,
            exclusion: null,
            lastUpdated: null,
            dataDate: null
        };
        try {
            await fs.unlink(CACHE_PATH);
            console.log('[Cache] Cleared prediction cache');
        } catch (error) {
            // Ignore if file doesn't exist
        }
    }
}

// Singleton
const predictionCache = new PredictionCacheService();

module.exports = predictionCache;
