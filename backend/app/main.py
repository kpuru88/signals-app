from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import hashlib
import json

from .models import (
    Company, VendorWatch, Signal, Report,
    AddVendorRequest, RunWatchlistRequest, TearSheetResponse, WeeklyReportRequest,
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

@app.post("/vendors/watch", response_model=Company)
async def add_vendor(request: AddVendorRequest):
    """Add a vendor to the watchlist"""
    company = Company(
        name=request.name,
        domains=request.domains,
        linkedin_url=request.linkedin_url,
        github_org=request.github_org,
        tags=request.tags
    )
    company = db.create_company(company)
    
    vendor_watch = VendorWatch(
        company_id=company.id,
        include_paths=request.include_paths
    )
    db.create_vendor_watch(vendor_watch)
    
    return company

@app.get("/vendors", response_model=List[Company])
async def list_vendors():
    """List all vendors in the watchlist"""
    return db.list_companies()

@app.get("/vendors/{company_id}", response_model=Company)
async def get_vendor(company_id: int):
    """Get a specific vendor"""
    company = db.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@app.put("/vendors/{company_id}", response_model=Company)
async def update_vendor(company_id: int, request: AddVendorRequest):
    """Update a vendor's information"""
    company = db.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Update company fields
    company.name = request.name
    company.domains = request.domains
    company.linkedin_url = request.linkedin_url
    company.github_org = request.github_org
    company.tags = request.tags
    
    # Update in database
    updated_company = db.update_company(company)
    return updated_company

@app.post("/run/watchlist")
async def run_watchlist(request: RunWatchlistRequest = None):
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
            vendor_watches = db.get_vendor_watches_by_company(company.id)
            
            for watch in vendor_watches:
                # Use base domains for better search results
                include_domains = company.domains.copy()
                
                # Create specific queries for each path type
                queries = []
                if '/pricing' in watch.include_paths:
                    queries.append(f"{company.name} pricing")
                if '/release-notes' in watch.include_paths or '/changelog' in watch.include_paths:
                    queries.append(f"{company.name} changelog release notes")
                if '/security' in watch.include_paths:
                    queries.append(f"{company.name} security updates")
                
                # Search for recent updates in the last month
                from datetime import datetime, timedelta
                last_month = datetime.utcnow() - timedelta(days=30)
                start_date = last_month.isoformat()
                
                print(f"DEBUG: Searching for {company.name} updates since {start_date}")
                
                # Search for recent updates
                search_queries = [
                    f"{company.name} new features product updates",
                    f"{company.name} pricing changes updates",
                    f"{company.name} discounts promotions offers"
                ]
                
                all_urls = []
                answer_result = None
                
                for query in search_queries:
                    try:
                        search_result = await exa.search(
                            query=query,
                            include_domains=include_domains,
                            start_published_date=start_date,
                            num_results=10
                        )
                        print(f"DEBUG: Search result for query '{query}': {search_result}")
                        
                        if isinstance(search_result, dict) and search_result.get("results"):
                            urls = [result["url"] for result in search_result["results"]]
                            all_urls.extend(urls)
                            print(f"DEBUG: Found {len(urls)} URLs for query '{query}'")
                    except Exception as e:
                        print(f"DEBUG: Error in search for query '{query}': {str(e)}")
                        continue
                
                # Remove duplicates
                all_urls = list(set(all_urls))
                print(f"DEBUG: Total unique URLs found: {len(all_urls)}")
                
                if all_urls:
                    try:
                        # Use Exa answer API to extract specific information
                        answer_query = f"""
                        Analyze the following {company.name} content and extract:
                        1. New product features launched in the last month
                        2. Pricing changes or updates in the last month  
                        3. Any discounts, promotions, or special offers in the last month
                        
                        For each finding, provide:
                        - Clear description of what changed
                        - Date or timeframe if mentioned
                        - Impact or significance
                        - Source URL
                        
                        Focus only on changes from the last 30 days.
                        """
                        
                        print(f"DEBUG: Getting answer for {len(all_urls)} URLs")
                        answer_result = await exa.answer(
                            query=answer_query,
                            urls=all_urls,
                            text=True
                        )
                        
                        print(f"DEBUG: Answer result: {answer_result}")
                        
                        # Process the answer and create signals
                        if answer_result.get("answer"):
                            answer_text = answer_result["answer"]
                            citations = answer_result.get("citations", [])
                            
                            # Create a comprehensive signal with all findings
                            signal = Signal(
                                company_id=company.id,
                                type=SignalType.PRODUCT_UPDATE,
                                title=f"Recent Updates for {company.name} (Last 30 Days)",
                                summary=answer_text,
                                severity=SignalSeverity.MEDIUM,
                                confidence=0.8,
                                urls=citations
                            )
                            db.create_signal(signal)
                            print(f"DEBUG: Created signal for {company.name} with {len(citations)} citations")
                        
                    except Exception as e:
                        print(f"DEBUG: Error getting answer: {str(e)}")
                        import traceback
                        print(f"DEBUG: Answer traceback: {traceback.format_exc()}")
                else:
                    print(f"DEBUG: No URLs found for {company.name}")
                
                watch.last_run_at = datetime.utcnow()
                
                # Store answer content for frontend display
                answer_content = answer_result.get("answer", "") if answer_result else ""
                citations = answer_result.get("citations", []) if answer_result else []
                
                results.append({
                    "company": company.name,
                    "paths_checked": watch.include_paths,
                    "urls_found": len(all_urls),
                    "signals_created": 1 if all_urls else 0,
                    "answer_content": answer_content,
                    "citations": citations
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
            return TearSheetResponse(
                company=company,
                overview="No information available - no search results found",
                funding={"status": "Information not available"},
                hiring_signals={"status": "Information not available"},
                product_updates=[],
                key_customers=[],
                citations=[]
            )
        
        answer_result = await exa.answer(
            query=f"Summarize what {company.name} does, their funding, recent releases, and notable customers. Include citations.",
            urls=urls,
            text=True
        )
        
        print(f"DEBUG: Answer result: {answer_result}")
        
        return TearSheetResponse(
            company=company,
            overview=answer_result.get("answer", "No overview available"),
            funding={"status": "Information not available"},
            hiring_signals={"status": "Information not available"},
            product_updates=[],
            key_customers=[],
            citations=urls
        )
    
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
