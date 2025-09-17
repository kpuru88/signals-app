#!/usr/bin/env python3
"""
Script to populate the database with Stripe and Cursor companies
"""

import requests
import json
import sys

API_BASE = "http://localhost:8000"

def add_company(name, domains, linkedin_url=None, github_org=None, include_paths=None, tags=None):
    """Add a company to the watchlist"""
    if include_paths is None:
        include_paths = ["/pricing", "/release-notes", "/changelog", "/security"]
    if tags is None:
        tags = []
    
    payload = {
        "name": name,
        "domains": domains,
        "linkedin_url": linkedin_url,
        "github_org": github_org,
        "include_paths": include_paths,
        "tags": tags
    }
    
    try:
        response = requests.post(f"{API_BASE}/vendors/watch", json=payload)
        if response.status_code == 200:
            company_data = response.json()
            print(f"✅ Added {name} (ID: {company_data['id']})")
            return company_data
        else:
            print(f"❌ Failed to add {name}: {response.status_code} - {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Error adding {name}: {e}")
        return None

def list_companies():
    """List all companies in the database"""
    try:
        response = requests.get(f"{API_BASE}/vendors")
        if response.status_code == 200:
            companies = response.json()
            print(f"\n📋 Current companies in database:")
            for company in companies:
                print(f"  - {company['name']} (ID: {company['id']}) - {company['domains'][0]}")
            return companies
        else:
            print(f"❌ Failed to list companies: {response.status_code}")
            return []
    except requests.exceptions.RequestException as e:
        print(f"❌ Error listing companies: {e}")
        return []

def test_signals_detection(company_id, company_name):
    """Test signals detection for a company"""
    try:
        payload = {
            "company_id": company_id,
            "signal_types": ["pricing_change", "product_update", "security_update"],
            "include_paths": ["/pricing", "/release-notes", "/changelog", "/security"],
            "start_date": "2025-01-10T00:00:00",
            "end_date": "2025-01-17T23:59:59",
            "use_livecrawl": False
        }
        
        response = requests.post(f"{API_BASE}/signals/detect", json=payload)
        if response.status_code == 200:
            signals = response.json()
            print(f"🎯 {company_name}: Found {len(signals)} signals")
            for i, signal in enumerate(signals[:2], 1):  # Show first 2 signals
                print(f"    {i}. {signal.get('evidence', [{}])[0].get('snippet', 'No snippet')}")
            return signals
        else:
            print(f"❌ Failed to detect signals for {company_name}: {response.status_code}")
            return []
    except requests.exceptions.RequestException as e:
        print(f"❌ Error detecting signals for {company_name}: {e}")
        return []

def main():
    print("🚀 Populating database with Stripe and Cursor...")
    
    # Check if backend is running
    try:
        response = requests.get(f"{API_BASE}/healthz")
        if response.status_code != 200:
            print("❌ Backend is not running. Please start the backend server first.")
            sys.exit(1)
    except requests.exceptions.RequestException:
        print("❌ Cannot connect to backend. Please start the backend server first.")
        sys.exit(1)
    
    # Add companies
    companies_to_add = [
        {
            "name": "Stripe",
            "domains": ["https://stripe.com/"],
            "linkedin_url": "https://www.linkedin.com/company/stripe/",
            "github_org": "stripe",
            "include_paths": ["/pricing", "/release-notes", "/changelog", "/security"],
            "tags": ["payments", "fintech"]
        },
        {
            "name": "Cursor",
            "domains": ["https://cursor.com/"],
            "linkedin_url": "https://www.linkedin.com/company/cursor/",
            "github_org": "getcursor",
            "include_paths": ["/pricing", "/release-notes", "/changelog", "/security"],
            "tags": ["ai", "development", "ide"]
        }
    ]
    
    added_companies = []
    for company_data in companies_to_add:
        company = add_company(**company_data)
        if company:
            added_companies.append(company)
    
    if not added_companies:
        print("❌ No companies were added successfully.")
        sys.exit(1)
    
    # List all companies
    list_companies()
    
    # Test signals detection
    print(f"\n🔍 Testing signals detection...")
    for company in added_companies:
        test_signals_detection(company['id'], company['name'])
    
    print(f"\n✅ Database populated successfully!")
    print(f"📊 Added {len(added_companies)} companies")
    print(f"\n💡 You can now test the Signals & Alerts tab in the frontend")

if __name__ == "__main__":
    main()
