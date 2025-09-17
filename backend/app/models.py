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
    funding: Dict[str, Any]
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
    funding: Dict[str, Any]
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
