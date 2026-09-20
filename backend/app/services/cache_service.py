import time
import threading
from typing import Any, Optional, Dict, Tuple

class TTLCache:
    """Thread-safe in-memory cache with Time-To-Live (TTL) and LRU eviction."""
    
    def __init__(self, maxsize: int = 1000, default_ttl: int = 3600):
        self.maxsize = maxsize
        self.default_ttl = default_ttl
        self._cache: Dict[str, Tuple[Any, float]] = {}  # key -> (value, expiry_timestamp)
        self._lock = threading.Lock()
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                self.misses += 1
                return None
            
            value, expiry = self._cache[key]
            if time.time() > expiry:
                del self._cache[key]
                self.misses += 1
                return None
            
            self.hits += 1
            return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        expiry = time.time() + (ttl if ttl is not None else self.default_ttl)
        with self._lock:
            if len(self._cache) >= self.maxsize:
                # Evict oldest entry
                oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k][1])
                del self._cache[oldest_key]
            self._cache[key] = (value, expiry)

    def invalidate(self, prefix: str = "") -> int:
        with self._lock:
            if not prefix:
                count = len(self._cache)
                self._cache.clear()
                return count
            keys_to_del = [k for k in self._cache if k.startswith(prefix)]
            for k in keys_to_del:
                del self._cache[k]
            return len(keys_to_del)

    def stats(self) -> Dict[str, Any]:
        with self._lock:
            total = self.hits + self.misses
            ratio = (self.hits / total * 100.0) if total > 0 else 0.0
            return {
                "hits": self.hits,
                "misses": self.misses,
                "total_requests": total,
                "hit_ratio_percent": round(ratio, 2),
                "cached_entries": len(self._cache),
                "max_capacity": self.maxsize
            }

# Global cache instances
cache = TTLCache(maxsize=2000, default_ttl=3600)
rag_cache = TTLCache(maxsize=1000, default_ttl=1800)
