import hashlib
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple

class AdvancedScoringEngine:
    def __init__(self, config):
        self.config = config
    
    def content_hash(self, title: str, url: str) -> str:
        """Generate content hash for deduplication using hashlib"""
        content = f"{title.lower().strip()}|{url.lower().strip()}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def deduplicate_events(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate near-duplicate events using content hashing"""
        seen_hashes = set()
        deduplicated = []
        
        for event in events:
            content_hash = self.content_hash(event.get("title", ""), event.get("url", ""))
            if content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                event["content_hash"] = content_hash
                deduplicated.append(event)
        
        return deduplicated
    
    def get_source_credibility_weight(self, domain: str) -> float:
        """Get source credibility weight for a domain"""
        if domain in self.config.source_credibility_weights:
            return self.config.source_credibility_weights[domain]
        
        if any(tier1 in domain for tier1 in ["techcrunch.com", "theverge.com", "arstechnica.com", "wired.com", "engadget.com"]):
            return self.config.source_credibility_weights.get("tier1_tech_media", 1.0)
        elif any(blog in domain for blog in [".com/blog", "/blog/", "medium.com", "/news/"]):
            return self.config.source_credibility_weights.get("company_blog", 0.9)
        else:
            return self.config.source_credibility_weights.get("low_tier_aggregator", 0.5)
    
    def recency_decay(self, age_days: float) -> float:
        """Apply exponential recency decay"""
        lambda_val = math.log(2) / self.config.recency_half_life_days
        return math.exp(-lambda_val * age_days)
    
    def calculate_event_impact(self, event: Dict[str, Any], event_type) -> float:
        """Calculate event impact score based on type and content"""
        if event_type.value == "product":
            title = event.get("title", "").lower()
            if any(word in title for word in ["major", "launch", "new product", "breakthrough"]):
                return 1.5
            elif any(word in title for word in ["feature", "update", "release"]):
                return 1.0
            else:
                return 0.5
        
        elif event_type.value == "funding":
            return 1.0
        
        elif event_type.value == "press":
            title = event.get("title", "").lower()
            if any(word in title for word in ["exclusive", "feature", "interview"]):
                return 1.2
            else:
                return 1.0
        
        elif event_type.value == "security":
            title = event.get("title", "").lower()
            if "critical" in title:
                return 1.2
            elif "high" in title:
                return 1.0
            elif "medium" in title:
                return 0.7
            else:
                return 0.6
        
        return 1.0
    
    def calculate_event_score(self, event: Dict[str, Any], event_type, now: datetime) -> float:
        """Calculate final event score with all factors"""
        try:
            published_date = event.get("publishedDate", now.isoformat())
            if isinstance(published_date, str):
                event_time = datetime.fromisoformat(published_date.replace('Z', '+00:00'))
            else:
                event_time = published_date
            age_days = (now - event_time).days
        except:
            age_days = 0
        
        url = event.get("url", "")
        domain = url.split("/")[2] if "/" in url and len(url.split("/")) > 2 else ""
        
        source_weight = self.get_source_credibility_weight(domain)
        type_weight = self.config.event_type_weights.get(event_type.value, 1.0)
        recency_weight = self.recency_decay(age_days)
        impact_weight = self.calculate_event_impact(event, event_type)
        
        return source_weight * type_weight * recency_weight * impact_weight
    
    def calculate_company_raw_activity(self, events: List) -> float:
        """Calculate raw activity score for a company"""
        return sum(event.raw_score for event in events)
    
    def apply_stabilizers(self, raw_score: float, events: List) -> float:
        """Apply burst penalty and balance bonus"""
        if not events:
            return raw_score
        
        weekly_scores = {}
        for event in events:
            week_key = event.timestamp.strftime("%Y-W%U")
            weekly_scores[week_key] = weekly_scores.get(week_key, 0) + event.raw_score
        
        if weekly_scores:
            max_week_score = max(weekly_scores.values())
            total_score = sum(weekly_scores.values())
            if max_week_score / (total_score + 1e-6) > 0.5:
                raw_score *= 0.9
        
        type_counts = {}
        for event in events:
            type_counts[event.event_type] = type_counts.get(event.event_type, 0) + 1
        
        if len(type_counts) >= 3:
            raw_score *= 1.05
        
        return raw_score
    
    def normalize_by_company_size(self, score: float, employee_count: Optional[int]) -> float:
        """Normalize score by company size using log1p"""
        if employee_count is None or employee_count <= 0:
            employee_count = 50
        
        return score / math.log1p(employee_count)
    
    def calculate_z_scores(self, scores: List[float]) -> List[float]:
        """Calculate z-scores within a group"""
        if len(scores) <= 1:
            return [0.0] * len(scores)
        
        mean_score = sum(scores) / len(scores)
        variance = sum((s - mean_score) ** 2 for s in scores) / len(scores)
        std_dev = math.sqrt(variance) + 1e-9
        
        return [(s - mean_score) / std_dev for s in scores]
    
    def calculate_percentiles(self, scores: List[float]) -> List[float]:
        """Calculate percentile ranks"""
        if not scores:
            return []
        
        sorted_scores = sorted(scores)
        percentiles = []
        
        for score in scores:
            rank = sum(1 for s in sorted_scores if s <= score)
            percentile = (rank / len(sorted_scores)) * 100
            percentiles.append(percentile)
        
        return percentiles
    
    def assign_quadrant(self, activity_percentile: float, impact_score: float) -> str:
        """Assign quadrant based on activity percentile and impact score"""
        cutoff = self.config.quadrant_cutoff_percentile
        
        if activity_percentile >= cutoff and impact_score >= cutoff:
            return "Leader"
        elif activity_percentile >= cutoff and impact_score < cutoff:
            return "Emerging Disruptor"
        elif activity_percentile < cutoff and impact_score >= cutoff:
            return "Sleeping Giant"
        else:
            return "Niche/Watch"
