import httpx
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

class ExaClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.exa.ai"
        self.headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "x-api-key": api_key
        }

    async def search(
        self,
        query: str,
        include_domains: Optional[List[str]] = None,
        exclude_domains: Optional[List[str]] = None,
        start_published_date: Optional[str] = None,
        end_published_date: Optional[str] = None,
        num_results: int = 10,
        include_text: Optional[List[str]] = None,
        exclude_text: Optional[List[str]] = None,
        category: Optional[str] = None,
        type: str = "auto"
    ) -> Dict[str, Any]:
        """Search for URLs using Exa API"""
        payload = {
            "query": query,
            "type": type,
            "numResults": num_results
        }
        
        if include_domains:
            payload["includeDomains"] = include_domains
        if exclude_domains:
            payload["excludeDomains"] = exclude_domains
        if start_published_date:
            payload["startPublishedDate"] = start_published_date
        if end_published_date:
            payload["endPublishedDate"] = end_published_date
        if include_text:
            payload["includeText"] = include_text
        if exclude_text:
            payload["excludeText"] = exclude_text
        if category:
            payload["category"] = category

        print(f"DEBUG: Exa search payload: {json.dumps(payload, indent=2)}")
        print(f"DEBUG: Exa search headers: {self.headers}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/search",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            print(f"DEBUG: Exa search response status: {response.status_code}")
            if response.status_code != 200:
                print(f"DEBUG: Exa search response text: {response.text}")
            response.raise_for_status()
            return response.json()

    async def get_contents(
        self,
        ids: List[str],
        text: bool = True,
        highlights: Optional[Dict[str, Any]] = None,
        summary: Optional[Dict[str, Any]] = None,
        livecrawl: str = "fallback",
        subpages: Optional[int] = None,
        subpage_target: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Get contents for URLs using Exa API"""
        payload = {
            "ids": ids,
            "text": text,
            "livecrawl": livecrawl
        }
        
        if highlights:
            payload["highlights"] = highlights
        if summary:
            payload["summary"] = summary
        if subpages:
            payload["subpages"] = subpages
        if subpage_target:
            payload["subpageTarget"] = subpage_target

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/contents",
                headers=self.headers,
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            return response.json()

    async def answer(
        self,
        query: str,
        urls: List[str],
        text: bool = True
    ) -> Dict[str, Any]:
        """Generate answer with citations using Exa API"""
        payload = {
            "query": query,
            "urls": urls,
            "text": text
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/answer",
                headers=self.headers,
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            return response.json()

exa_client = None

def get_exa_client() -> ExaClient:
    global exa_client
    
    # Import here to avoid circular imports
    from .database import db
    
    # Try to get API key from settings first
    api_key = None
    try:
        settings_config = db.get_latest_settings_configuration()
        if settings_config and settings_config.api_keys and settings_config.api_keys.get("exa_api_key"):
            api_key = settings_config.api_keys["exa_api_key"]
            print(f"DEBUG: Using API key from settings")
    except Exception as e:
        print(f"DEBUG: Error getting API key from settings: {e}")
    
    # Fall back to environment variable if no settings API key
    if not api_key:
        api_key = os.getenv("EXA_API_KEY")
        print(f"DEBUG: Using API key from environment variable")
    
    if not api_key:
        raise ValueError("EXA_API_KEY not found in settings or environment variable")
    
    # Create new client instance (don't cache since settings might change)
    exa_client = ExaClient(api_key)
    return exa_client
