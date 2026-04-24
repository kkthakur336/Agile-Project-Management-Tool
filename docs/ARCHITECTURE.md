# Architecture Overview

## Executive Summary
Sprintly is designed as a modular Single Page Application (SPA) utilizing a modern technology stack to provide real-time project management capabilities. The architecture prioritizes state consistency, low-latency updates, and secure data isolation.

## Technical Stack
- **Frontend Layer**: React 18 with TypeScript for type-safe component development.
- **Backend-as-a-Service (BaaS)**: Supabase, providing authentication, PostgreSQL database, and real-time subscription services.
- **State Management**: React Context API for global theme and session management, supplemented by local state for component-specific logic.

## Structural Design

### Routing Engine
The application employs a custom hash-based routing system implemented within the primary application controller. This design choice facilitates deep-linking and browser history persistence without the overhead of external routing libraries, ensuring optimal performance for the dashboard's modular UI.

### Real-time Synchronization
Data synchronization is achieved via the Supabase Realtime engine. The application subscribes to PostgreSQL replication streams, allowing for instantaneous UI updates when tasks are modified, or invitations are processed by other team members.

### Component Hierarchy
The component architecture is strictly divided into functional directories:
- **Pages**: Top-level views containing business logic and data-fetching hooks.
- **Modals**: Transactional UI elements for discrete operations (e.g., project creation, user invitation).
- **Components**: Reusable, atomic UI elements following a consistent design system.
