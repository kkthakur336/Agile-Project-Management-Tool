# API Documentation

## Overview
The application utilizes the Supabase JavaScript SDK to interface with a PostgreSQL backend. While standard CRUD operations are handled via the RESTful interface provided by PostgREST, critical business logic is encapsulated within Remote Procedure Calls (RPC).

## Custom RPC Reference

### `accept_invitation`
Handles the transition of a pending invitee to an active project member.

- **Parameters**: 
    - `invitation_id` (uuid): The unique identifier of the invitation record.
- **Access Level**: Authenticated User.
- **Logic**: 
    1. Verifies the existence and status of the invitation.
    2. Inserts a record into the `project_members` table.
    3. Updates the invitation status to 'Accepted'.
    4. Records a notification for the inviter.

### `revoke_invitation`
Enables administrative users to terminate a user's access to a project.

- **Parameters**: 
    - `target_invite_id` (uuid): The identifier for the specific invitation.
- **Access Level**: Project Administrator.
- **Logic**: 
    1. Identifies the user and project associated with the invitation.
    2. Removes the user from the `project_members` table.
    3. Deletes the invitation record.
    4. Triggers an immediate cessation of access via Row Level Security policies.

## Real-time Subscriptions
Clients subscribe to changes in the following channels:
- `public:notifications`: To receive live alerts for assignments and invites.
- `public:tasks`: To sync task board state across multiple active users.
