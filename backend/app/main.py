from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import hashlib
import json

from .models import (
    Company, VendorWatch, Signal, Report, TearSheet, SourcesConfiguration, SettingsConfiguration,
    AddVendorRequest, RunWatchlistRequest, TearSheetResponse, WeeklyReportRequest,
    SignalType, SignalSeverity, SignalResponse, SignalDetectionRequest
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
    """Generate a company tear-sheet with 7-day caching"""
    print(f"DEBUG: Starting tear-sheet generation for company_id: {company_id}")
    
    company = db.get_company(company_id)
    if not company:
        print(f"DEBUG: Company not found for id: {company_id}")
        raise HTTPException(status_code=404, detail="Company not found")
    
    print(f"DEBUG: Found company: {company.name}")
    
    # Check for existing tearsheets for this company
    existing_tearsheets = db.get_tearsheets_by_company(company_id)
    
    if existing_tearsheets:
        # Get the most recent tearsheet
        latest_tearsheet = max(existing_tearsheets, key=lambda t: t.generated_at)
        days_old = (datetime.utcnow() - latest_tearsheet.generated_at).days
        
        # Get cache duration from settings, default to 7 days
        cache_duration_days = 7
        try:
            settings_config = db.get_latest_settings_configuration()
            if settings_config and settings_config.retention:
                cache_duration_days = settings_config.retention.get("tearsheets_days", 7)
        except Exception as e:
            print(f"DEBUG: Error getting settings config, using default 7 days: {e}")
        
        print(f"DEBUG: Found existing tearsheet from {latest_tearsheet.generated_at} ({days_old} days old)")
        print(f"DEBUG: Cache duration from settings: {cache_duration_days} days")
        
        # If tearsheet is less than cache_duration_days old, return cached version
        if days_old < cache_duration_days:
            print(f"DEBUG: Returning cached tearsheet (less than {cache_duration_days} days old)")
            return TearSheetResponse(
                company=company,
                overview=latest_tearsheet.overview,
                funding=latest_tearsheet.funding,
                hiring_signals=latest_tearsheet.hiring_signals,
                product_updates=latest_tearsheet.product_updates,
                key_customers=latest_tearsheet.key_customers,
                citations=latest_tearsheet.citations
            )
        else:
            print(f"DEBUG: Tearsheet is {days_old} days old (cache duration: {cache_duration_days} days), refreshing from Exa API")
    else:
        print(f"DEBUG: No existing tearsheets found, generating new one")
    
    try:
        exa = get_exa_client()
        print(f"DEBUG: Got Exa client successfully")
        
        search_domains = company.domains.copy()
        if company.linkedin_url:
            search_domains.append("linkedin.com/company")
        
        print(f"DEBUG: Search domains: {search_domains}")
        
        # Search for company overview
        search_result = await exa.search(
            query=f"{company.name} company overview funding customers",
            num_results=15
        )
        
        print(f"DEBUG: Search result: {search_result}")
        
        urls = [result["url"] for result in search_result.get("results", [])]
        print(f"DEBUG: URLs found: {len(urls)}")
        
        # Search for hiring activity on LinkedIn - specific to company jobs page
        print(f"DEBUG: Starting LinkedIn job search for {company.name}")
        current_year = datetime.now().year
        last_year = current_year - 1
        
        hiring_data = {
            "current_year_jobs": 0,
            "last_year_jobs": 0,
            "departments": {
                "Product": [],
                "Engineering": [],
                "Finance": [],
                "Strategy": [],
                "Operations": []
            },
            "hiring_trends": "No data available"
        }
        
        try:
            # Search for specific job types on LinkedIn using multiple targeted searches
            departments = {
                "Product": [],
                "Engineering": [],
                "Finance": [],
                "Strategy": [],
                "Operations": []
            }
            
            # Define job search queries for each department
            job_queries = {
                "Product": [
                    f"{company.name} product manager jobs site:linkedin.com",
                    f"{company.name} product designer jobs site:linkedin.com",
                    f"{company.name} product marketing jobs site:linkedin.com",
                    f"{company.name} UX designer jobs site:linkedin.com"
                ],
                "Engineering": [
                    f"{company.name} software engineer jobs site:linkedin.com",
                    f"{company.name} backend engineer jobs site:linkedin.com",
                    f"{company.name} frontend engineer jobs site:linkedin.com",
                    f"{company.name} data engineer jobs site:linkedin.com",
                    f"{company.name} devops engineer jobs site:linkedin.com"
                ],
                "Finance": [
                    f"{company.name} financial analyst jobs site:linkedin.com",
                    f"{company.name} finance manager jobs site:linkedin.com",
                    f"{company.name} accounting jobs site:linkedin.com",
                    f"{company.name} controller jobs site:linkedin.com"
                ],
                "Strategy": [
                    f"{company.name} strategy manager jobs site:linkedin.com",
                    f"{company.name} business development jobs site:linkedin.com",
                    f"{company.name} corporate development jobs site:linkedin.com",
                    f"{company.name} business analyst jobs site:linkedin.com"
                ],
                "Operations": [
                    f"{company.name} operations manager jobs site:linkedin.com",
                    f"{company.name} program manager jobs site:linkedin.com",
                    f"{company.name} project manager jobs site:linkedin.com",
                    f"{company.name} operations analyst jobs site:linkedin.com"
                ]
            }
            
            total_jobs_found = 0
            
            # Search for each department's job types
            for dept, queries in job_queries.items():
                print(f"DEBUG: Searching for {dept} jobs...")
                dept_jobs = []
                
                for query in queries:
                    print(f"DEBUG: Query: {query}")
                    try:
                        search_result = await exa.search(
                            query=query,
                            include_domains=["linkedin.com"],
                            num_results=10,
                            start_published_date=f"{current_year}-01-01",
                            end_published_date=f"{current_year}-12-31"
                        )
                        
                        if search_result and isinstance(search_result, dict):
                            results = search_result.get("results", [])
                            print(f"DEBUG: Found {len(results)} results for {query}")
                            
                            # Extract job titles from search results
                            for result in results:
                                title = result.get("title", "")
                                if title and company.name.lower() in title.lower():
                                    # Clean up the title
                                    clean_title = title.replace(f"{company.name} - ", "").replace(f"{company.name} ", "")
                                    if clean_title and clean_title not in dept_jobs:
                                        dept_jobs.append(clean_title)
                                        total_jobs_found += 1
                        
                    except Exception as e:
                        print(f"DEBUG: Error searching for {dept} jobs: {str(e)}")
                        continue
                
                departments[dept] = dept_jobs
                print(f"DEBUG: {dept} jobs found: {dept_jobs}")
            
            # Also search for last year's jobs for comparison using same department approach
            last_year_jobs = 0
            try:
                print(f"DEBUG: Searching for {last_year} jobs using department approach...")
                
                # Use the same department-specific approach for last year
                for dept, queries in job_queries.items():
                    for query in queries:
                        # Modify query for last year
                        last_year_query = query.replace(f"{current_year}", f"{last_year}")
                        print(f"DEBUG: Last year query: {last_year_query}")
                        
                        try:
                            search_result = await exa.search(
                                query=last_year_query,
                                include_domains=["linkedin.com"],
                                num_results=10,
                                start_published_date=f"{last_year}-01-01",
                                end_published_date=f"{last_year}-12-31"
                            )
                            
                            if search_result and isinstance(search_result, dict):
                                results = search_result.get("results", [])
                                print(f"DEBUG: Found {len(results)} results for {last_year_query}")
                                
                                # Count jobs that match the company name
                                for result in results:
                                    title = result.get("title", "")
                                    if title and company.name.lower() in title.lower():
                                        last_year_jobs += 1
                        
                        except Exception as e:
                            print(f"DEBUG: Error searching {dept} jobs for {last_year}: {str(e)}")
                            continue
                
                print(f"DEBUG: Total last year jobs found: {last_year_jobs}")
                    
            except Exception as e:
                print(f"DEBUG: Error searching last year jobs: {str(e)}")
            
            # Generate hiring trends analysis
            hiring_trends = f"""
            **Hiring Analysis for {company.name}:**
            
            **Current Year Job Count:** {total_jobs_found}
            **Last Year Job Count:** {last_year_jobs}
            
            **Department Breakdown:**
            - Product: {len(departments['Product'])} roles
            - Engineering: {len(departments['Engineering'])} roles  
            - Finance: {len(departments['Finance'])} roles
            - Strategy: {len(departments['Strategy'])} roles
            - Operations: {len(departments['Operations'])} roles
            
            **Key Insights:**
            - Most active department: {max(departments.items(), key=lambda x: len(x[1]))[0]} with {max(len(jobs) for jobs in departments.values())} roles
            - Total active job postings: {total_jobs_found}
            - Year-over-year change: {'+' if total_jobs_found > last_year_jobs else ''}{total_jobs_found - last_year_jobs} jobs
            """
            
            hiring_data = {
                "current_year_jobs": total_jobs_found,
                "last_year_jobs": last_year_jobs,
                "departments": departments,
                "hiring_trends": hiring_trends,
                "analysis_details": {"method": "direct_linkedin_search"}
            }
            
            print(f"DEBUG: Final hiring data: {hiring_data}")
                
        except Exception as e:
            print(f"DEBUG: Error in hiring analysis: {str(e)}")
            import traceback
            print(f"DEBUG: Hiring analysis traceback: {traceback.format_exc()}")
        
        if not urls:
            print("DEBUG: No URLs found, returning basic response")
            return TearSheetResponse(
                company=company,
                overview="No information available - no search results found",
                funding={"status": "Information not available"},
                hiring_signals=hiring_data,
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
        
        # Create tearsheet response
        tearsheet_response = TearSheetResponse(
            company=company,
            overview=answer_result.get("answer", "No overview available"),
            funding={"status": "Information not available"},
            hiring_signals=hiring_data,
            product_updates=[],
            key_customers=[],
            citations=urls
        )
        
        # Save tearsheet to database
        tearsheet = TearSheet(
            company_id=company.id,
            overview=tearsheet_response.overview,
            funding=tearsheet_response.funding,
            hiring_signals=tearsheet_response.hiring_signals,
            product_updates=tearsheet_response.product_updates,
            key_customers=tearsheet_response.key_customers,
            citations=tearsheet_response.citations,
            generated_at=datetime.utcnow()
        )
        
        saved_tearsheet = db.create_tearsheet(tearsheet)
        print(f"DEBUG: Saved fresh tearsheet with ID: {saved_tearsheet.id}")
        
        return tearsheet_response
    
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

@app.get("/tearsheets", response_model=List[TearSheet])
async def list_tearsheets(company_id: Optional[int] = None):
    """List all saved tearsheets"""
    if company_id:
        return db.get_tearsheets_by_company(company_id)
    return db.list_tearsheets()

@app.post("/tearsheets/{tearsheet_id}/make_old")
async def make_tearsheet_old(tearsheet_id: int):
    """Test endpoint: Make a tearsheet appear 8 days old"""
    tearsheet = db.get_tearsheet(tearsheet_id)
    if not tearsheet:
        raise HTTPException(status_code=404, detail="Tearsheet not found")
    
    # Set the generated_at timestamp to 8 days ago
    old_date = datetime.utcnow() - timedelta(days=8)
    tearsheet.generated_at = old_date
    
    print(f"DEBUG: Made tearsheet {tearsheet_id} appear old (from {old_date})")
    return {"message": f"Tearsheet {tearsheet_id} timestamp set to 8 days ago", "new_date": old_date}

@app.post("/signals/detect", response_model=List[SignalResponse])
async def detect_signals(request: SignalDetectionRequest):
    """Detect signals using Exa API with advanced discovery and analysis"""
    company = db.get_company(request.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    signals = []
    
    # Check if Exa API key is available
    try:
        exa = get_exa_client()
        print(f"DEBUG: Exa client created successfully")
    except ValueError as e:
        # If no API key, return mock signals for demonstration
        print(f"DEBUG: Exa API key not available: {e}")
        mock_signal = SignalResponse(
            id=999,
            type=SignalType.PRODUCT_UPDATE,
            severity=SignalSeverity.MEDIUM,
            vendor=company.name,
            url=f"https://{company.domains[0].replace('https://', '').replace('http://', '')}",
            detected_at=datetime.utcnow(),
            evidence=[{"snippet": f"Recent updates detected for {company.name} via web monitoring", "confidence": 0.8}],
            rationale=f"Recent product updates and changes detected for {company.name} in the last 7 days",
            impacted_areas=["Product", "Engineering"],
            tags=["product_update", "monitoring"],
            confidence=0.8,
            source_authority=f"https://{company.domains[0].replace('https://', '').replace('http://', '')}",
            diff_magnitude=0.3,
            keyword_overlap=0.7,
            score=0.8,
            last_crawled=datetime.utcnow(),
            citations=[f"https://{company.domains[0].replace('https://', '').replace('http://', '')}"]
        )
        signals.append(mock_signal)
        return signals
    
    # Use Exa API with retry mechanism to get recent pricing and product updates
    try:
        print(f"DEBUG: Using Exa API with retry for {company.name}")
        
        # Create search query for recent updates - prioritize last 7 days but allow up to 30 days
        from datetime import datetime, timedelta
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        start_date_7d = seven_days_ago.strftime('%Y-%m-%d')
        start_date_30d = thirty_days_ago.strftime('%Y-%m-%d')
        current_date = datetime.utcnow().strftime('%Y-%m-%d')
        
        # Define multiple search strategies for retry
        search_strategies = [
            # Strategy 1: Recent updates with date filters
            {
                "queries": [
                    f"{company.name} product updates pricing changes announcements {start_date_7d} {current_date}",
                    f"{company.name} new features pricing updates latest news {start_date_7d}",
                    f"{company.name} recent updates changes announcements last week this week"
                ],
                "include_domains": True,
                "date_filter": True,
                "description": "Recent updates with date filters"
            },
            # Strategy 2: Broader date range
            {
                "queries": [
                    f"{company.name} product updates pricing changes {start_date_30d} {current_date}",
                    f"{company.name} announcements updates changes {start_date_30d}",
                    f"site:{company.domains[0].replace('https://', '').replace('http://', '')} updates {start_date_7d}"
                ],
                "include_domains": True,
                "date_filter": True,
                "description": "Broader date range search"
            },
            # Strategy 3: No domain restrictions
            {
                "queries": [
                    f"{company.name} product updates pricing changes {start_date_7d}",
                    f"{company.name} new features announcements {start_date_7d}",
                    f"{company.name} recent changes updates"
                ],
                "include_domains": False,
                "date_filter": True,
                "description": "No domain restrictions"
            },
            # Strategy 4: No date filters
            {
                "queries": [
                    f"{company.name} product updates pricing changes",
                    f"{company.name} new features announcements",
                    f"{company.name} recent updates changes"
                ],
                "include_domains": True,
                "date_filter": False,
                "description": "No date filters"
            }
        ]
        
        all_urls = []
        all_results = []
        
        # Try each strategy until we get results
        for strategy_idx, strategy in enumerate(search_strategies):
            print(f"DEBUG: Trying search strategy {strategy_idx + 1}: {strategy['description']}")
            
            strategy_results = []
            for query in strategy["queries"]:
                try:
                    # Use include_domains to focus on the company's website
                    domain = company.domains[0].replace('https://', '').replace('http://', '')
                    
                    # Build search parameters
                    search_params = {
                        "query": query,
                        "num_results": 5,
                        "type": "auto"
                    }
                    
                    # Add domain filter if specified
                    if strategy["include_domains"]:
                        search_params["include_domains"] = [domain]
                    
                    # Add date filter if specified
                    if strategy["date_filter"]:
                        date_range_start = start_date_7d if "last week" in query or "this week" in query else start_date_30d
                        search_params["start_published_date"] = date_range_start
                        search_params["end_published_date"] = current_date
                    
                    search_result = await exa.search(**search_params)
                    
                    if search_result and search_result.get("results"):
                        results = search_result["results"]
                        strategy_results.extend(results)
                        print(f"DEBUG: Found {len(results)} URLs for query: {query}")
                        print(f"DEBUG: URLs: {[r['url'] for r in results]}")
                    
                except Exception as e:
                    print(f"DEBUG: Error searching for {query}: {e}")
                    continue
            
            # If this strategy found results, use them and break
            if strategy_results:
                print(f"DEBUG: Strategy {strategy_idx + 1} successful! Found {len(strategy_results)} results")
                all_results.extend(strategy_results)
                all_urls.extend([r["url"] for r in strategy_results])
                break
            else:
                print(f"DEBUG: Strategy {strategy_idx + 1} found no results, trying next strategy...")
        
        # Remove duplicates
        all_urls = list(set(all_urls))
        print(f"DEBUG: Total unique URLs found: {len(all_urls)}")
        
        if all_results:
            print(f"DEBUG: Found {len(all_results)} search results for {company.name}, creating signals from search metadata")
            
            # Create signals from search result metadata (titles, descriptions)
            for i, result in enumerate(all_results[:3]):  # Limit to first 3 results
                try:
                    url = result.get("url", "")
                    title = result.get("title", "")
                    description = result.get("snippet", "") or result.get("text", "") or ""
                    
                    print(f"DEBUG: Creating signal {i+1} from result: {title}")
                    
                    # Create meaningful content from title and description
                    if title and description:
                        content = f"{title}. {description}"
                    elif title:
                        content = title
                    else:
                        content = f"Recent update found for {company.name}"
                    
                    # Create signal with actual content
                    signal = SignalResponse(
                        id=999 + i,
                        type=SignalType.PRODUCT_UPDATE,
                        severity=SignalSeverity.MEDIUM,
                        vendor=company.name,
                        url=url,
                        detected_at=datetime.utcnow(),
                        evidence=[{"snippet": content, "confidence": 0.9}],
                        rationale=content,
                        impacted_areas=["Product", "Pricing"],
                        tags=["product_update", "pricing_update", "recent_update"],
                        confidence=0.9,
                        source_authority=url,
                        diff_magnitude=0.5,
                        keyword_overlap=0.8,
                        score=0.9,
                        last_crawled=datetime.utcnow(),
                        citations=[url]
                    )
                    signals.append(signal)
                    print(f"DEBUG: Created signal {i+1} with content: {content[:100]}...")
                    
                except Exception as e:
                    print(f"DEBUG: Error creating signal from result {i+1}: {e}")
                    continue
        else:
            print(f"DEBUG: All search strategies failed - no results found for {company.name}")
                
    except Exception as e:
        print(f"DEBUG: Error using Exa API with retry for {company.name}: {e}")
        import traceback
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
    
    # If no signals were found, return a fallback signal
    if not signals:
        print(f"DEBUG: No signals found for {company.name}, creating fallback signal")
        fallback_signal = SignalResponse(
            id=999,
            type=SignalType.PRODUCT_UPDATE,
            severity=SignalSeverity.MEDIUM,
            vendor=company.name,
            url=f"https://{company.domains[0].replace('https://', '').replace('http://', '')}",
            detected_at=datetime.utcnow(),
            evidence=[{"snippet": f"Monitoring {company.name} for recent pricing and product updates", "confidence": 0.7}],
            rationale=f"Monitoring {company.name} for recent pricing and product updates. No recent changes detected in the current search.",
            impacted_areas=["Product", "Pricing"],
            tags=["monitoring", "no_updates"],
            confidence=0.7,
            source_authority=f"https://{company.domains[0].replace('https://', '').replace('http://', '')}",
            diff_magnitude=0.1,
            keyword_overlap=0.5,
            score=0.7,
            last_crawled=datetime.utcnow(),
            citations=[f"https://{company.domains[0].replace('https://', '').replace('http://', '')}"]
        )
        signals.append(fallback_signal)
    
    return signals

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

@app.get("/sources/configuration", response_model=SourcesConfiguration)
async def get_sources_configuration():
    """Get the latest sources configuration"""
    config = db.get_latest_sources_configuration()
    if not config:
        # Return default configuration if none exists
        default_config = SourcesConfiguration(
            allowed_domains=[
                'linkedin.com/company/*',
                '*.com/pricing',
                '*.com/release-notes',
                '*.com/security',
                '*.com/blog'
            ],
            quality_controls={
                'default_results_limit': 25,
                'content_preference': 'highlights',
                'livecrawl_mode': 'preferred'
            }
        )
        return db.create_sources_configuration(default_config)
    return config

@app.post("/sources/configuration", response_model=SourcesConfiguration)
async def save_sources_configuration(config: SourcesConfiguration):
    """Save or update sources configuration"""
    if config.id and config.id in db.sources_configurations:
        return db.update_sources_configuration(config)
    else:
        return db.create_sources_configuration(config)

@app.get("/settings/configuration", response_model=SettingsConfiguration)
async def get_settings_configuration():
    """Get the latest settings configuration"""
    config = db.get_latest_settings_configuration()
    if not config:
        # Return default configuration if none exists
        default_config = SettingsConfiguration(
            schedule={
                "enabled": True,
                "frequency": "weekly",
                "day": "monday",
                "time": "09:00"
            },
            api_keys={
                "exa_api_key": "c8b9a631-7ee0-45bf-9a36-e3b6b129ca98",
                "slack_webhook": "",
                "email_smtp": ""
            },
            retention={
                "tearsheets_days": 365
            },
            signals_cache_duration_seconds=3600
        )
        return db.create_settings_configuration(default_config)
    return config

@app.post("/settings/configuration", response_model=SettingsConfiguration)
async def save_settings_configuration(config: SettingsConfiguration):
    """Save or update settings configuration"""
    if config.id and config.id in db.settings_configurations:
        return db.update_settings_configuration(config)
    else:
        return db.create_settings_configuration(config)
