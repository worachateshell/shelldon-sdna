# Social Media Feed Integration Plan

## Goal
Create a new page to display posts with hashtag **#sdnawedding** from Instagram and Facebook.

## API Research Findings

### Instagram Graph API
✅ **Supported** - Can search hashtags and retrieve posts
- Requires Instagram Business/Creator Account linked to Facebook
- Requires Facebook App with approved permissions:
  - `instagram_basic`
  - Instagram Public Content Access feature
- **Limitations**:
  - Max 30 unique hashtags per 7-day rolling period
  - No Stories support
  - No emoji hashtags
  - Cannot access consumer accounts (only Business/Creator)

### Facebook Graph API
❌ **Not Supported** - Hashtag search deprecated since Graph API v2.0 (2014)
- No official way to search public posts by hashtag
- Would need third-party social listening tools

## Proposed Solution

### Option 1: Instagram Only (Recommended)
Create a page that displays Instagram posts with #sdnawedding using:
1. Instagram Graph API (requires setup and approval)
2. Backend endpoint to fetch and cache posts
3. Frontend gallery to display posts

### Option 2: Client-Side Embed Widgets
Use third-party embed solutions:
- Instagram feed widgets (e.g., EmbedSocial, Taggbox)
- No API setup required
- Limited customization

### Option 3: Mock/Static Display
Display a curated gallery of pre-selected posts:
- Manual curation
- No API dependencies
- Full control over content

## Recommended Approach: Option 2 (Client-Side Embed)
For quick implementation without complex API setup and approval process:
1. Use a free Instagram feed widget service
2. Embed the widget in a new HTML page
3. Style to match the wedding theme

## Implementation Steps
1. Create new page `social-feed.html`
2. Integrate Instagram embed widget
3. Add navigation link from main pages
4. Style with Cool Black theme
5. Add loading states and error handling

## Alternative: Simple Instagram Embed
Use Instagram's native embed feature:
- Manually embed specific posts
- No API required
- Limited to individual posts, not hashtag feed
