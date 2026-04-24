# Database Schema Documentation

## Table Definitions

### `profiles`
Centralized user metadata synchronized with Supabase Authentication.
- `id` (uuid, Primary Key): Foreign key to `auth.users`.
- `full_name` (text): Display name of the user.
- `role` (text): System-wide role (Admin/Member).
- `bio` (text): Optional professional summary.
- `notification_settings` (jsonb): Structured preferences for system alerts.

### `projects`
Organizational containers for collaborative work.
- `id` (uuid, Primary Key): Unique identifier.
- `name` (text): Project designation.
- `description` (text): Project scope and details.
- `owner_id` (uuid): References `profiles.id` (Creator).
- `status` (text): Lifecycle state (Active, Completed, Archived).
- `due_date` (timestamptz): Project deadline.

### `tasks`
Atomic units of work within a project.
- `id` (uuid, Primary Key): Unique identifier.
- `project_id` (uuid): Reference to `projects.id`.
- `title` (text): Task description.
- `status` (text): Workflow state (Backlog, In Progress, Review, Done).
- `priority` (text): Urgency level (Low, Medium, High).
- `assignee_id` (uuid): Reference to `profiles.id`.

### `invitations`
Governance records for project onboarding.
- `id` (uuid, Primary Key): Unique identifier.
- `project_id` (uuid): Reference to `projects.id`.
- `email` (text): Recipient email address.
- `role` (text): Target role within the project.
- `status` (text): Current state (Pending, Accepted, Declined).

## Relationships
- **One-to-Many**: `projects` to `tasks`.
- **Many-to-Many**: `profiles` to `projects` via the `project_members` junction table.
- **One-to-Many**: `profiles` to `tasks` (Assignee relationship).
