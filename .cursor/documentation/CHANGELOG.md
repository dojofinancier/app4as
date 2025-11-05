# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Guest checkout with account creation during payment
- Dual rate system (student rate vs tutor base rate)
- Credit bank system for appointment cancellations
- Session-based cart system for guest users
- Payment Intent flow with database storage for cart data
- Comprehensive webhook system for Make.com integration
- Student dashboard with profile management, reservations, messaging
- Tutor dashboard with availability management and earnings tracking
- Admin dashboard with analytics and management tools

### Changed
- Payment flow migrated from Checkout Session to Payment Intent
- Cart system now supports both authenticated and guest users
- RLS policies updated for guest cart access
- Environment variable validation added to app startup

### Fixed
- RLS policies for guest cart and slot hold access
- Webhook idempotency issues
- Payment Intent data storage for webhook processing
- Console.log statements replaced with production-safe logger

### Security
- Removed all debug/test routes and pages
- Removed debug API endpoints
- Added environment variable validation
- Implemented production-safe logging

### Documentation
- Created comprehensive README.md
- Organized migration files into docs/migrations/
- Created documentation guide and ADR structure
- Moved chat history to .cursor/chats/ for reference

---

## [1.0.0] - TBD

### Added
- Initial production release

---

## How to Update This Changelog

When making changes:
1. Add entries under `[Unreleased]` section
2. Use appropriate categories: Added, Changed, Fixed, Security, Documentation
3. Be specific about what changed
4. When releasing, move `[Unreleased]` entries to a new version section
5. Add release date in format: `## [X.Y.Z] - YYYY-MM-DD`

