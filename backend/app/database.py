from typing import Dict, List, Optional
from datetime import datetime
import hashlib
import json
from .models import Company, VendorWatch, PageSnapshot, Diff, Signal, Report, TearSheet, SourcesConfiguration, SettingsConfiguration

class InMemoryDatabase:
    def __init__(self):
        self.companies: Dict[int, Company] = {}
        self.vendor_watches: Dict[int, VendorWatch] = {}
        self.page_snapshots: Dict[int, PageSnapshot] = {}
        self.diffs: Dict[int, Diff] = {}
        self.signals: Dict[int, Signal] = {}
        self.reports: Dict[int, Report] = {}
        self.tearsheets: Dict[int, TearSheet] = {}
        self.sources_configurations: Dict[int, SourcesConfiguration] = {}
        self.settings_configurations: Dict[int, SettingsConfiguration] = {}
        
        self._company_counter = 1
        self._vendor_watch_counter = 1
        self._page_snapshot_counter = 1
        self._diff_counter = 1
        self._signal_counter = 1
        self._report_counter = 1
        self._tearsheet_counter = 1
        self._sources_config_counter = 1
        self._settings_config_counter = 1

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

    def update_company(self, company: Company) -> Company:
        if company.id and company.id in self.companies:
            self.companies[company.id] = company
            return company
        else:
            raise ValueError(f"Company with id {company.id} not found")

    def create_vendor_watch(self, vendor_watch: VendorWatch) -> VendorWatch:
        vendor_watch.id = self._vendor_watch_counter
        vendor_watch.created_at = datetime.utcnow()
        self.vendor_watches[self._vendor_watch_counter] = vendor_watch
        self._vendor_watch_counter += 1
        return vendor_watch

    def get_vendor_watches_by_company(self, company_id: int) -> List[VendorWatch]:
        return [vw for vw in self.vendor_watches.values() if vw.company_id == company_id]

    def list_vendor_watches(self) -> List[VendorWatch]:
        return list(self.vendor_watches.values())

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

    def get_signals(self) -> List[Signal]:
        return sorted(self.signals.values(), key=lambda x: x.created_at or datetime.min, reverse=True)

    def create_tearsheet(self, tearsheet: TearSheet) -> TearSheet:
        tearsheet.id = self._tearsheet_counter
        tearsheet.created_at = datetime.utcnow()
        self.tearsheets[self._tearsheet_counter] = tearsheet
        self._tearsheet_counter += 1
        return tearsheet

    def get_tearsheet(self, tearsheet_id: int) -> Optional[TearSheet]:
        return self.tearsheets.get(tearsheet_id)

    def get_tearsheets_by_company(self, company_id: int) -> List[TearSheet]:
        return [t for t in self.tearsheets.values() if t.company_id == company_id]

    def list_tearsheets(self) -> List[TearSheet]:
        return sorted(self.tearsheets.values(), key=lambda x: x.created_at or datetime.min, reverse=True)

    def create_sources_configuration(self, config: SourcesConfiguration) -> SourcesConfiguration:
        config.id = self._sources_config_counter
        config.created_at = datetime.utcnow()
        config.updated_at = datetime.utcnow()
        self.sources_configurations[self._sources_config_counter] = config
        self._sources_config_counter += 1
        return config

    def update_sources_configuration(self, config: SourcesConfiguration) -> SourcesConfiguration:
        if config.id in self.sources_configurations:
            config.updated_at = datetime.utcnow()
            self.sources_configurations[config.id] = config
        return config

    def get_sources_configuration(self, config_id: int = 1) -> Optional[SourcesConfiguration]:
        return self.sources_configurations.get(config_id)

    def get_latest_sources_configuration(self) -> Optional[SourcesConfiguration]:
        if not self.sources_configurations:
            return None
        return max(self.sources_configurations.values(), key=lambda x: x.created_at or datetime.min)

    def create_settings_configuration(self, config: SettingsConfiguration) -> SettingsConfiguration:
        config.id = self._settings_config_counter
        config.created_at = datetime.utcnow()
        config.updated_at = datetime.utcnow()
        self.settings_configurations[self._settings_config_counter] = config
        self._settings_config_counter += 1
        return config

    def update_settings_configuration(self, config: SettingsConfiguration) -> SettingsConfiguration:
        if config.id in self.settings_configurations:
            config.updated_at = datetime.utcnow()
            self.settings_configurations[config.id] = config
        return config

    def get_settings_configuration(self, config_id: int = 1) -> Optional[SettingsConfiguration]:
        return self.settings_configurations.get(config_id)

    def get_latest_settings_configuration(self) -> Optional[SettingsConfiguration]:
        if not self.settings_configurations:
            return None
        return max(self.settings_configurations.values(), key=lambda x: x.created_at or datetime.min)

db = InMemoryDatabase()
