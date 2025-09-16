from typing import Dict, List, Optional
from datetime import datetime
import hashlib
import json
from .models import Company, CompanyWatch, PageSnapshot, Diff, Signal, Report, TearSheet

class InMemoryDatabase:
    def __init__(self):
        self.companies: Dict[int, Company] = {}
        self.company_watches: Dict[int, CompanyWatch] = {}
        self.page_snapshots: Dict[int, PageSnapshot] = {}
        self.diffs: Dict[int, Diff] = {}
        self.signals: Dict[int, Signal] = {}
        self.reports: Dict[int, Report] = {}
        self.tearsheets: Dict[int, TearSheet] = {}
        
        self._company_counter = 1
        self._company_watch_counter = 1
        self._page_snapshot_counter = 1
        self._diff_counter = 1
        self._signal_counter = 1
        self._report_counter = 1
        self._tearsheet_counter = 1

    def create_company(self, company: Company) -> Company:
        company.id = self._company_counter
        company.created_at = datetime.utcnow()
        self.companies[self._company_counter] = company
        self._company_counter += 1
        return company

    def get_company(self, company_id: int) -> Optional[Company]:
        return self.companies.get(company_id)

    def list_companies(self) -> List[Company]:
        return list(self.companies.values())

    def create_company_watch(self, company_watch: CompanyWatch) -> CompanyWatch:
        company_watch.id = self._company_watch_counter
        company_watch.created_at = datetime.utcnow()
        self.company_watches[self._company_watch_counter] = company_watch
        self._company_watch_counter += 1
        return company_watch

    def get_company_watches_by_company(self, company_id: int) -> List[CompanyWatch]:
        return [cw for cw in self.company_watches.values() if cw.company_id == company_id]

    def list_company_watches(self) -> List[CompanyWatch]:
        return list(self.company_watches.values())

    def create_page_snapshot(self, snapshot: PageSnapshot) -> PageSnapshot:
        snapshot.id = self._page_snapshot_counter
        self.page_snapshots[self._page_snapshot_counter] = snapshot
        self._page_snapshot_counter += 1
        return snapshot

    def get_latest_snapshot(self, company_id: int, url: str) -> Optional[PageSnapshot]:
        snapshots = [s for s in self.page_snapshots.values() 
                    if s.company_id == company_id and s.url == url]
        return max(snapshots, key=lambda x: x.fetched_at) if snapshots else None

    def create_signal(self, signal: Signal) -> Signal:
        signal.id = self._signal_counter
        signal.created_at = datetime.utcnow()
        self.signals[self._signal_counter] = signal
        self._signal_counter += 1
        return signal

    def list_signals(self, company_id: Optional[int] = None) -> List[Signal]:
        signals = list(self.signals.values())
        if company_id:
            signals = [s for s in signals if s.company_id == company_id]
        return sorted(signals, key=lambda x: x.created_at or datetime.min, reverse=True)

    def create_report(self, report: Report) -> Report:
        report.id = self._report_counter
        report.created_at = datetime.utcnow()
        self.reports[self._report_counter] = report
        self._report_counter += 1
        return report

    def list_reports(self) -> List[Report]:
        return sorted(self.reports.values(), key=lambda x: x.created_at or datetime.min, reverse=True)

    def create_tearsheet(self, tearsheet: TearSheet) -> TearSheet:
        tearsheet.id = self._tearsheet_counter
        tearsheet.created_at = datetime.utcnow()
        self.tearsheets[self._tearsheet_counter] = tearsheet
        self._tearsheet_counter += 1
        return tearsheet

    def get_tearsheet_by_company(self, company_id: int) -> Optional[TearSheet]:
        tearsheets = [t for t in self.tearsheets.values() if t.company_id == company_id]
        return max(tearsheets, key=lambda x: x.created_at or datetime.min) if tearsheets else None

db = InMemoryDatabase()
