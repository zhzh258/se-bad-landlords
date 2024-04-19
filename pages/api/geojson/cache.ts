import { LRUCache } from "lru-cache";

const HOURS_TO_EXPIRE = 1;

const cache = new LRUCache({
    max: 500,                   // The maximum size of the cache
    ttl: 1000 * 60 * 60 * HOURS_TO_EXPIRE // Items expire after HOURS_TO_EXPIRE hours
});

export default cache