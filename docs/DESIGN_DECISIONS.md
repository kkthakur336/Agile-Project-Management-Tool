# Design Decisions and Tradeoffs

## Architecture Selection
### Hash-Based Routing
**Decision**: Implementation of a custom hash-based routing system instead of an external library like React Router.
**Rationale**: For a high-performance dashboard, minimal bundle size and direct control over history state were prioritized. 
**Tradeoff**: This approach requires manual management of URL synchronization but results in a more lightweight and predictable navigation experience for SPA transitions.

## Data Storage Strategy
### JSONB for User Preferences
**Decision**: Utilization of a `jsonb` column for notification settings in the `profiles` table.
**Rationale**: This provides the flexibility to append new preference types without schema migrations.
**Tradeoff**: Slight increase in query complexity for filtering by specific settings, though this is negligible for the current application scale.

## UI/UX Implementation
### Head-Script Theme Injection
**Decision**: Inclusion of a theme-detection script in the `index.html` head section.
**Rationale**: To prevent "Flash of Unstyled Content" (FOUC) during the React hydration phase.
**Tradeoff**: Introduces a minor blocking script before the DOM is fully parsed, but ensures a premium, flicker-free dark mode experience.

### CSS Transition Strategy
**Decision**: Global application of 400ms cubic-bezier transitions for theme switching.
**Rationale**: Enhances the perceived quality of the application during theme toggling.
**Tradeoff**: Requires careful management of CSS variables to avoid layout thrashing on lower-end devices.
