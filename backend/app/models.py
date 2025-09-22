from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class SignalType(str, Enum):
    PRICING_CHANGE = "pricing_change"
    PRODUCT_UPDATE = "product_update"
    SECURITY_UPDATE = "security_update"
    FUNDING = "funding"
    HIRING = "hiring"

class SignalSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Company(BaseModel):
    id: Optional[int] = None
    name: str
    domains: List[str]
    linkedin_url: Optional[str] = None
    github_org: Optional[str] = None
    tags: List[str] = []
    employees: Optional[int] = None
    vertical: Optional[str] = None
    created_at: Optional[datetime] = None

class VendorWatch(BaseModel):
    id: Optional[int] = None
    company_id: int
    include_paths: List[str]  # e.g., ["/pricing", "/release-notes", "/security"]
    last_run_at: Optional[datetime] = None
    schedule: str = "weekly"
    created_at: Optional[datetime] = None

class PageSnapshot(BaseModel):
    id: Optional[int] = None
    company_id: int
    url: str
    content_hash: str
    fetched_at: datetime
    text_md: str
    summary_json: Dict[str, Any]

class Diff(BaseModel):
    id: Optional[int] = None
    snapshot_id_old: int
    snapshot_id_new: int
    diff_json: Dict[str, Any]
    severity: SignalSeverity
    section: str  # "pricing", "changelog", "security"

class Signal(BaseModel):
    id: Optional[int] = None
    company_id: int
    type: SignalType
    title: str
    summary: str
    severity: SignalSeverity
    confidence: float
    urls: List[str]
    citations: Optional[List[str]] = None
    created_at: Optional[datetime] = None

class Report(BaseModel):
    id: Optional[int] = None
    period_start: datetime
    period_end: datetime
    contents_md: str
    url_list: List[str]
    created_at: Optional[datetime] = None

class AddVendorRequest(BaseModel):
    name: str
    domains: List[str]
    include_paths: List[str]
    linkedin_url: Optional[str] = None
    github_org: Optional[str] = None
    tags: List[str] = []

class RunWatchlistRequest(BaseModel):
    company_ids: Optional[List[int]] = None  # If None, run for all companies

class TearSheet(BaseModel):
    id: Optional[int] = None
    company_id: int
    overview: str
    executives: Dict[str, Any]
    hiring_signals: Dict[str, Any]
    citations: List[str]
    generated_at: datetime
    created_at: Optional[datetime] = None

class SourcesConfiguration(BaseModel):
    id: Optional[int] = None
    allowed_domains: List[str]
    quality_controls: Dict[str, Any]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SettingsConfiguration(BaseModel):
    id: Optional[int] = None
    schedule: Dict[str, Any]
    api_keys: Dict[str, Any]
    retention: Dict[str, int]
    signals_cache_duration_seconds: int = 3600  # Default 1 hour
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class TearSheetResponse(BaseModel):
    company: Company
    overview: str
    executives: Dict[str, Any]
    hiring_signals: Dict[str, Any]
    citations: List[str]

class WeeklyReportRequest(BaseModel):
    period_start: datetime
    period_end: datetime
    company_ids: Optional[List[int]] = None

class SignalDetectionRequest(BaseModel):
    company_id: int
    signal_types: List[SignalType] = [SignalType.PRICING_CHANGE, SignalType.PRODUCT_UPDATE, SignalType.SECURITY_UPDATE]
    include_paths: List[str] = ["/pricing", "/release-notes", "/changelog", "/security"]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    use_livecrawl: bool = False

class EvidenceItem(BaseModel):
    before: Optional[str] = None
    after: Optional[str] = None
    snippet: str
    confidence: float

class SignalResponse(BaseModel):
    id: Optional[int] = None
    type: SignalType
    severity: SignalSeverity
    vendor: str
    url: str
    detected_at: datetime
    evidence: List[EvidenceItem]
    rationale: str
    impacted_areas: List[str]
    tags: List[str]
    confidence: float
    source_authority: str
    diff_magnitude: float
    keyword_overlap: float
    score: float
    last_crawled: Optional[datetime] = None
    citations: List[str] = []

class EventType(str, Enum):
    PRODUCT = "product"
    FUNDING = "funding"
    PRESS = "press"
    SECURITY = "security"

class ProcessedEvent(BaseModel):
    id: Optional[str] = None
    company_id: int
    event_type: EventType
    title: str
    url: str
    source_domain: str
    timestamp: datetime
    content_hash: str
    raw_score: float
    impact_score: float
    confidence: float
    created_at: Optional[datetime] = None

class ScoringConfiguration(BaseModel):
    id: Optional[int] = None
    source_credibility_weights: Dict[str, float] = {
        "company_blog": 0.9,
        "tier1_tech_media": 1.0,
        "low_tier_aggregator": 0.5
    }
    event_type_weights: Dict[str, float] = {
        "product": 1.0,
        "funding": 0.9,
        "press": 0.6,
        "security": 0.8
    }
    recency_half_life_days: int = 60
    lookback_window_days: int = 180
    quadrant_cutoff_percentile: int = 60
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CompanyScoreResult(BaseModel):
    company_id: int
    company_name: str
    activity_score: float
    activity_percentile: float
    activity_z_score: float
    impact_score: float
    momentum: float
    confidence: float
    quadrant: str
    explanations: List[str]
    sample_links: List[str]

class CompetitivePositioningCache(BaseModel):
    id: Optional[int] = None
    company_id: int
    data: Dict[str, Any]  # The competitive positioning data
    cache_key: str  # Unique key for this data combination
    expires_at: datetime
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CompetitivePositioningRequest(BaseModel):
    company_ids: Optional[List[int]] = None  # If None, get for all companies
    force_refresh: bool = False  # Force refresh even if cache is valid
    cache_duration_hours: int = 24  # How long to cache the data

class CompanySearchRequest(BaseModel):
    query: str
    max_results: int = 10

class CompanySearchResult(BaseModel):
    name: str
    domains: List[str]
    description: Optional[str] = None
    suggested_paths: List[str] = ["/pricing", "/release-notes", "/security"]
    linkedin_url: Optional[str] = None
    tags: List[str] = []

class CompanySearchResponse(BaseModel):
    results: List[CompanySearchResult]
    query: str
    total_results: int
