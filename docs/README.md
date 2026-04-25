# Sprintly — The Enterprise Agile Workspace

![Sprintly Banner](https://img.shields.io/badge/Sprintly-Elite_Agile_Management-5C4FE5?style=for-the-badge&logo=react&logoColor=white)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Sprintly is a high-performance, real-time Agile Project Management platform. Designed for professional environments, it integrates a sophisticated interface with robust backend logic to manage projects, tasks, and team invitations with transactional integrity.

------

##  Product Walkthrough

<p align="center">
  <a href="https://drive.google.com/file/d/1HMeS6IwoPKk5w3mvCFSP1AzC5tNpPcFp/view?usp=sharing">
    <img src="https://drive.google.com/thumbnail?id=1HMeS6IwoPKk5w3mvCFSP1AzC5tNpPcFp" alt="Sprintly Demo" width="800"/>
  </a>
</p>

<p align="center">
  <em>Click to watch the full Sprintly product walkthrough</em>
</p>

---

## Table of Contents
- [Key Features](#key-features)
- [Technical Stack](#technical-stack)
- [Quick Start Guide](#quick-start-guide)
- [Supabase Configuration](#supabase-configuration)
- [Database Schema](#database-schema)
- [API and Custom Functions](#api-and-custom-functions)
- [Project Structure](#project-structure)
- [Security and RLS Analysis](#security-and-rls-analysis)
- [UI Feature Overview](#ui-feature-overview)
- [Local Testing Workflow](#local-testing-workflow)
- [Deployment Guide](#deployment-guide)
- [Contribution Standards](#contribution-standards)
- [Roadmap and Future Scope](#roadmap-and-future-scope)

---

## Key Features

- **Real-time Dashboard**: Persistent tracking of completed, in-progress, and overdue tasks, complemented by daily activity analytics.
- **Smart Task Board**: Comprehensive filtering, priority management, and project-centric task isolation.
- **Enterprise Invitation System**: 
  - Project-specific invitations with real-time internal notifications.
  - Secure data isolation (project metadata visibility restricted until formal acceptance).
  - Administrative Revocation mechanism to terminate access across all database layers.
- **Advanced Dark Mode**: Zero-flicker implementation with global state synchronization and high-fidelity CSS transitions.
- **Consistent Navigation**: Hash-based routing to ensure state persistence across sessions and browser history compatibility.

---

## Technical Stack

### Core Components
- **React 18**: Component-based user interface architecture.
- **TypeScript**: Static typing for robust state management and error prevention.
- **Vite**: High-speed build tool and development environment.

### Infrastructure and Storage
- **Supabase (PostgreSQL)**: Relational database management.
- **Supabase Auth**: JWT-based secure authentication.
- **Supabase Realtime**: Real-time updates via PostgreSQL replication channels.

---

## Quick Start Guide

### 1. Prerequisites
- **Node.js** version 18.x or higher.
- **Supabase Account** (Standard or Enterprise tiers).

### 2. Installation
```bash
git clone <repository-url>
cd Agile-Project-Management-Tool
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory with the following parameters:
```env
VITE_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

### 4. Database Initialization
Execute the SQL scripts located in `supabase/sql/` in the following sequence:
1. `01_profiles.sql`
2. `02_projects.sql`
3. `03_tasks.sql`
4. `05_invitations.sql`
5. `15_notify_invitee.sql`
6. `17_accept_invitation_fn.sql`
7. `20_revoke_invitation_fn.sql`
8. `21_profile_notification_settings.sql`

---

## Extended Database Schema

### Table: `profiles`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key, references `auth.users`. |
| `full_name` | text | User display name. |
| `role` | text | Administrative or Member role designation. |
| `notification_settings`| jsonb | Persistent user interface preferences. |

### Table: `projects`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key, unique identifier. |
| `name` | text | Project designation. |
| `owner_id` | uuid | Creator identifier (references `profiles`). |

---

## API and Custom Functions (RPC)

Critical transactions are encapsulated within PostgreSQL Remote Procedure Calls:

### `accept_invitation(invitation_id uuid)`
- **Security Context**: `security definer`.
- **Functionality**: Performs an atomic update of invitation status and establishes project membership records.

### `revoke_invitation(target_invite_id uuid)`
- **Security Context**: `security definer`.
- **Functionality**: Terminates invitation records and deletes associated project membership, enforcing immediate cessation of access via RLS.

---

## Security and RLS Analysis

Sprintly implements a Zero-Trust security model via PostgreSQL Row Level Security:
- **Data Isolation**: Project records are restricted to authenticated members only.
- **Audit Logging**: Task modifications and invitations are logged with associated user identifiers.
- **Application Governance**: Frontend authentication guards ensure immediate redirection for unauthorized access attempts.

---

## UI Feature Overview

### Dashboard
The central command center, providing high-level metrics such as task completion rates and overdue tracking via real-time analytical charts.

### Task Management
A robust workspace allowing for multi-dimensional task filtering. Administrative users possess the authority to manage team composition dynamically.

### Theme Preferences
A custom-engineered theme system utilizing head-script injection to maintain dark mode consistency and eliminate layout flickering during hydration.

---

## Local Testing Workflow

1. **Invitation Issuance**: An administrator issues a project invitation.
2. **Notification Reception**: The target user receives a real-time system alert.
3. **Acceptance Phase**: The user navigates to the Invitations portal to accept the terms.
4. **Access Validation**: Both parties gain synchronized visibility into the project workspace.

---

## Deployment Guide

### Hosting Providers (Vercel / Netlify)
1. Link the version control repository to the hosting platform.
2. Configure the build command as `npm run build`.
3. Set the deployment directory to `dist`.
4. Configure environment variables (`VITE_SUPABASE_URL`, etc.) within the provider's management console.

---

## Contribution Standards

1. **Branching Strategy**: Use `feat/` or `fix/` prefixes for all development branches.
2. **Code Integrity**: Adherence to ESLint and Prettier configurations is mandatory.
3. **Typing Standards**: Use of `any` types is prohibited. All API interfaces must be explicitly typed.

---

## Roadmap and Future Scope

- [ ] **Gantt Chart Visualization**: Graphical timeline for project lifecycle management.
- [ ] **Analytical Reporting**: Automated team performance and velocity reports.
- [ ] **Asset Management**: Integration with object storage for task attachments.

---
