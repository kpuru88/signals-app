from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import hashlib
import json

from .models import (
    Company, CompanyWatch, Signal, Report, TearSheet,
    AddCompanyRequest, RunWatchlistRequest, TearSheetResponse, WeeklyReportRequest,
    SignalType, SignalSeverity
)
from .database import db
from .exa_client import get_exa_client

load_dotenv()

app = FastAPI(title="Signals API", description="Competitive Intelligence Radar")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/companies/watch", response_model=Company)
async def add_company(request: AddCompanyRequest):
    """Add a company to the watchlist"""
    company = Company(
        name=request.name,
        domains=request.domains,
        linkedin_url=request.linkedin_url,
        github_org=request.github_org,
        tags=request.tags
    )
    company = db.create_company(company)
    
    company_watch = CompanyWatch(
        company_id=company.id,
        include_paths=request.include_paths
    )
    db.create_company_watch(company_watch)
    
    return company

@app.get("/companies", response_model=List[Company])
async def list_companies():
    """List all companies in the watchlist"""
    return db.list_companies()

@app.get("/companies/{company_id}", response_model=Company)
async def get_company(company_id: int):
    """Get a specific company"""
    company = db.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@app.get("/companies/{company_id}/watch", response_model=Dict[str, Any])
async def get_company_with_watch(company_id: int):
    """Get a company with its watch data"""
    company = db.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    watches = db.get_company_watches_by_company(company_id)
    return {
        "company": company,
        "include_paths": watches[0].include_paths if watches else []
    }

@app.post("/run/watchlist")
async def run_watchlist(request: Optional[RunWatchlistRequest] = None):
    """Run the watchlist crawl for specified companies or all companies"""
    try:
        exa = get_exa_client()
        
        if request and request.company_ids:
            companies = [db.get_company(cid) for cid in request.company_ids]
            companies = [c for c in companies if c is not None]
        else:
            companies = db.list_companies()
        
        results = []
        
        for company in companies:
            if company.id is None:
                continue
            company_watches = db.get_company_watches_by_company(company.id)
            
            for watch in company_watches:
                include_domains = []
                for domain in company.domains:
                    for path in watch.include_paths:
                        include_domains.append(f"{domain}{path}")
                
                path_queries = []
                for path in watch.include_paths:
                    if "/pricing" in path:
                        path_queries.append(f"{company.name} pricing changes plans costs")
                    elif "/release-notes" in path or "/changelog" in path:
                        path_queries.append(f"{company.name} release notes updates changelog")
                    elif "/security" in path:
                        path_queries.append(f"{company.name} security updates compliance")
                    else:
                        path_queries.append(f"{company.name} {path.replace('/', '')} updates")
                
                query = path_queries[0] if path_queries else f"{company.name} updates"
                
                print(f"DEBUG: Using targeted query: {query}")
                print(f"DEBUG: Include domains: {include_domains}")
                
                search_result = await exa.search(
                    query=query,
                    include_domains=include_domains,
                    num_results=10
                )
                
                print(f"DEBUG: Search result URLs: {[r.get('url') for r in search_result.get('results', [])]}")
                
                if search_result.get("results"):
                    urls = [result["url"] for result in search_result["results"]]
                    
                    contents_result = await exa.get_contents(
                        ids=urls,
                        text=True,
                        livecrawl="preferred",
                        summary={
                            "query": "Extract pricing information, product updates, and security changes",
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "pricing_changes": {"type": "array", "items": {"type": "string"}},
                                    "product_updates": {"type": "array", "items": {"type": "string"}},
                                    "security_updates": {"type": "array", "items": {"type": "string"}}
                                }
                            }
                        }
                    )
                    
                    print(f"DEBUG: Contents result count: {len(contents_result.get('results', []))}")
                    
                    for content in contents_result.get("results", []):
                        print(f"DEBUG: Processing content from URL: {content.get('url')}")
                        print(f"DEBUG: Content summary: {content.get('summary')}")
                        
                        if content.get("summary"):
                            summary_data = content["summary"]
                            print(f"DEBUG: Summary data type: {type(summary_data)}")
                            print(f"DEBUG: Summary data content: {summary_data}")
                            
                            if isinstance(summary_data, str):
                                try:
                                    import json
                                    summary_data = json.loads(summary_data)
                                except:
                                    print(f"DEBUG: Could not parse summary as JSON: {summary_data}")
                                    continue
                            
                            if not isinstance(summary_data, dict):
                                print(f"DEBUG: Summary data is not a dict, skipping: {type(summary_data)}")
                                continue
                            
                            if summary_data.get("pricing_changes") and company.id is not None:
                                try:
                                    signal = Signal(
                                        company_id=company.id,
                                        type=SignalType.PRICING_CHANGE,
                                        title=f"Pricing changes detected for {company.name}",
                                        summary="; ".join(summary_data["pricing_changes"]),
                                        severity=SignalSeverity.HIGH,
                                        confidence=0.8,
                                        urls=[content["url"]]
                                    )
                                    created_signal = db.create_signal(signal)
                                    print(f"DEBUG: Created pricing signal with ID: {created_signal.id}")
                                except Exception as e:
                                    print(f"DEBUG: Error creating pricing signal: {str(e)}")
                            
                            if summary_data.get("product_updates") and company.id is not None:
                                try:
                                    signal = Signal(
                                        company_id=company.id,
                                        type=SignalType.PRODUCT_UPDATE,
                                        title=f"Product updates for {company.name}",
                                        summary="; ".join(summary_data["product_updates"]),
                                        severity=SignalSeverity.MEDIUM,
                                        confidence=0.7,
                                        urls=[content["url"]]
                                    )
                                    created_signal = db.create_signal(signal)
                                    print(f"DEBUG: Created product signal with ID: {created_signal.id}")
                                except Exception as e:
                                    print(f"DEBUG: Error creating product signal: {str(e)}")
                            
                            if summary_data.get("security_updates") and company.id is not None:
                                try:
                                    signal = Signal(
                                        company_id=company.id,
                                        type=SignalType.SECURITY_UPDATE,
                                        title=f"Security updates for {company.name}",
                                        summary="; ".join(summary_data["security_updates"]),
                                        severity=SignalSeverity.HIGH,
                                        confidence=0.8,
                                        urls=[content["url"]]
                                    )
                                    created_signal = db.create_signal(signal)
                                    print(f"DEBUG: Created security signal with ID: {created_signal.id}")
                                except Exception as e:
                                    print(f"DEBUG: Error creating security signal: {str(e)}")
                
                watch.last_run_at = datetime.utcnow()
                
                results.append({
                    "company": company.name,
                    "paths_checked": watch.include_paths,
                    "urls_found": len(search_result.get("results", []))
                })
        
        return {"message": "Watchlist run completed", "results": results}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running watchlist: {str(e)}")

@app.get("/tearsheet/{company_id}", response_model=TearSheetResponse)
async def get_tearsheet(company_id: int):
    """Generate a company tear-sheet"""
    print(f"DEBUG: Starting tear-sheet generation for company_id: {company_id}")
    
    company = db.get_company(company_id)
    if not company:
        print(f"DEBUG: Company not found for id: {company_id}")
        raise HTTPException(status_code=404, detail="Company not found")
    
    print(f"DEBUG: Found company: {company.name}")
    
    existing_tearsheet = db.get_tearsheet_by_company(company_id)
    if existing_tearsheet:
        print(f"DEBUG: Found existing tear sheet for company: {company.name}")
        return TearSheetResponse(
            company=company,
            overview=existing_tearsheet.overview,
            funding=existing_tearsheet.funding,
            hiring_signals=existing_tearsheet.hiring_signals,
            product_updates=existing_tearsheet.product_updates,
            key_customers=existing_tearsheet.key_customers,
            citations=existing_tearsheet.citations
        )
    
    try:
        exa = get_exa_client()
        print(f"DEBUG: Got Exa client successfully")
        
        search_domains = company.domains.copy()
        if company.linkedin_url:
            search_domains.append("linkedin.com/company")
        
        print(f"DEBUG: Search domains: {search_domains}")
        
        search_result = await exa.search(
            query=f"{company.name} company overview funding customers",
            num_results=15
        )
        
        print(f"DEBUG: Search result: {search_result}")
        
        urls = [result["url"] for result in search_result.get("results", [])]
        print(f"DEBUG: URLs found: {len(urls)}")
        
        if not urls:
            print("DEBUG: No URLs found, returning basic response")
            tearsheet_data = TearSheetResponse(
                company=company,
                overview="No information available - no search results found",
                funding={"status": "Information not available"},
                hiring_signals={"status": "Information not available"},
                product_updates=[],
                key_customers=[],
                citations=[]
            )
        else:
            answer_result = await exa.answer(
                query=f"Summarize what {company.name} does, their funding, recent releases, and notable customers. Include citations.",
                urls=urls,
                text=True
            )
            
            print(f"DEBUG: Answer result: {answer_result}")
            
            tearsheet_data = TearSheetResponse(
                company=company,
                overview=answer_result.get("answer", "No overview available"),
                funding={"status": "Information not available"},
                hiring_signals={"status": "Information not available"},
                product_updates=[],
                key_customers=[],
                citations=urls
            )
        
        tearsheet = TearSheet(
            company_id=company_id,
            overview=tearsheet_data.overview,
            funding=tearsheet_data.funding,
            hiring_signals=tearsheet_data.hiring_signals,
            product_updates=tearsheet_data.product_updates,
            key_customers=tearsheet_data.key_customers,
            citations=tearsheet_data.citations
        )
        db.create_tearsheet(tearsheet)
        print(f"DEBUG: Saved tear sheet to database for company: {company.name}")
        
        return tearsheet_data
    
    except Exception as e:
        print(f"DEBUG: Exception occurred: {str(e)}")
        print(f"DEBUG: Exception type: {type(e)}")
        import traceback
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error generating tear-sheet: {str(e)}")

@app.get("/signals", response_model=List[Signal])
async def list_signals(company_id: Optional[int] = None):
    """List signals/alerts"""
    return db.list_signals(company_id=company_id)

@app.post("/reports/weekly", response_model=Report)
async def generate_weekly_report(request: WeeklyReportRequest):
    """Generate a weekly report"""
    signals = db.list_signals()
    
    filtered_signals = [
        s for s in signals 
        if s.created_at and request.period_start <= s.created_at <= request.period_end
    ]
    
    company_signals = {}
    for signal in filtered_signals:
        company = db.get_company(signal.company_id)
        if company:
            if company.name not in company_signals:
                company_signals[company.name] = []
            company_signals[company.name].append(signal)
    
    report_md = f"# Weekly Competitive Intelligence Report\n\n"
    report_md += f"**Period:** {request.period_start.strftime('%Y-%m-%d')} to {request.period_end.strftime('%Y-%m-%d')}\n\n"
    
    for company_name, signals in company_signals.items():
        report_md += f"## {company_name}\n\n"
        for signal in signals:
            report_md += f"- **{signal.type.value.replace('_', ' ').title()}**: {signal.summary}\n"
        report_md += "\n"
    
    report = Report(
        period_start=request.period_start,
        period_end=request.period_end,
        contents_md=report_md,
        url_list=[url for signal in filtered_signals for url in signal.urls]
    )
    
    return db.create_report(report)

@app.get("/reports", response_model=List[Report])
async def list_reports():
    """List all reports"""
    return db.list_reports()
