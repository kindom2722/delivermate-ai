# DeliverMate AI Multiplayer Collaboration Plan

## Purpose

This document is the execution-ready plan for adding multiplayer collaboration to DeliverMate AI in a new implementation session.

Recommended scope for V1:

- Team-internal collaboration first
- Shared workspaces
- Member roles and permissions
- Comments, mentions, and review flow
- Document version history
- Activity timeline

Do not start with:

- Full realtime co-editing
- Customer portal
- Billing / multi-tenant SaaS architecture
- Complex project management boards

## Product framing

DeliverMate is not trying to become a generic project-management system.

The collaboration unit should be:

```text
Workspace
-> source materials
-> AI analysis
-> generated documents
-> knowledge assets
-> review activity
```

The main goal is to let a delivery team collaborate around delivery artifacts, not around tasks for their own sake.

## V1 outcome

After V1, a small team should be able to:

1. Enter the same workspace
2. View the same materials and generated documents
3. Edit documents with author attribution
4. Leave comments on documents and materials
5. Track versions and restore earlier document states
6. See who uploaded, analyzed, edited, commented, or exported

## Recommended phases

### Phase 1: Data model and workspace boundary

Goal:
Move the app from single-user local data to workspace-scoped collaboration data.

Required schema additions:

- `User`
- `Workspace`
- `WorkspaceMember`
- add `workspaceId` to:
  - `SourceMaterial`
  - `GeneratedDocument`
  - `AnalysisResult`
  - `ChatMessage`
  - `KnowledgeAsset`

Recommended fields:

- `User`
  - `id`
  - `name`
  - `email`
  - `avatarUrl`
  - `createdAt`
- `Workspace`
  - `id`
  - `name`
  - `description`
  - `createdByUserId`
  - `createdAt`
  - `updatedAt`
- `WorkspaceMember`
  - `id`
  - `workspaceId`
  - `userId`
  - `role`
  - `joinedAt`

Recommended roles:

- `OWNER`
- `EDITOR`
- `REVIEWER`
- `VIEWER`

Acceptance criteria:

- Every core record belongs to a workspace
- Workspace members can be queried efficiently
- Existing material/document flows still work after workspace scoping

### Phase 2: Authentication and session foundation

Goal:
Introduce enough auth to identify collaborators cleanly.

Recommendation:

- Start with one pragmatic auth solution
- For local development, prefer email magic link or GitHub login
- Keep auth integration thin and avoid custom auth from scratch

Implementation notes:

- Add server-side session lookup
- Resolve current user before any workspace-sensitive query
- Filter data by workspace membership

Acceptance criteria:

- Signed-in user identity is available server-side
- Non-members cannot access another workspace by URL or ID

### Phase 3: Workspace UX

Goal:
Give users a visible collaboration container.

UI additions:

- Workspace switcher in the app shell
- Workspace overview page or panel
- Member list and invite management

Actions:

- Create workspace
- Rename workspace
- Invite member
- Change member role
- Remove member

Acceptance criteria:

- User can create and switch workspaces
- Membership affects visible content immediately

### Phase 4: Comment system

Goal:
Enable async collaboration before realtime editing.

Recommended comment targets:

- source material
- generated document
- analysis result

Suggested schema:

- `Comment`
  - `id`
  - `workspaceId`
  - `authorUserId`
  - `targetType`
  - `targetId`
  - `body`
  - `resolvedAt`
  - `resolvedByUserId`
  - `createdAt`
  - `updatedAt`
- `CommentMention`
  - `id`
  - `commentId`
  - `mentionedUserId`

V1 behavior:

- Create comment
- Reply thread optional
- Resolve/unresolve
- Mention users with `@name`

Acceptance criteria:

- Reviewers can leave comments without overwriting document content
- Teams can track unresolved feedback

### Phase 5: Document version history

Goal:
Make collaboration safe by preserving previous document states.

Suggested schema:

- `DocumentVersion`
  - `id`
  - `generatedDocumentId`
  - `workspaceId`
  - `createdByUserId`
  - `titleSnapshot`
  - `contentSnapshot`
  - `reason`
  - `createdAt`

Suggested behavior:

- Create a version on every manual save
- Optionally create a version on AI regeneration
- Show diff-lite metadata first
- Restore an old version by copying its snapshot into the current document

Acceptance criteria:

- Users can see who changed a document and when
- Users can restore a previous version without manual copy/paste

### Phase 6: Activity timeline

Goal:
Create team visibility across the workspace.

Suggested schema:

- `ActivityLog`
  - `id`
  - `workspaceId`
  - `actorUserId`
  - `entityType`
  - `entityId`
  - `action`
  - `metadata`
  - `createdAt`

Track actions such as:

- material created
- file uploaded
- analysis generated
- document generated
- document edited
- document restored
- comment added
- comment resolved
- export triggered

Acceptance criteria:

- Workspace timeline is readable and useful for audit/review

## V2 extensions

Only after V1 is solid:

- Realtime presence
- Realtime document co-editing
- Section-level locking or conflict handling
- Customer-facing reviewers
- Approval gates and sign-off
- Notifications center

## API plan

Add workspace-aware routes first:

- `GET /api/workspaces`
- `POST /api/workspaces`
- `GET /api/workspaces/:id`
- `POST /api/workspaces/:id/members`
- `PATCH /api/workspaces/:id/members/:memberId`
- `DELETE /api/workspaces/:id/members/:memberId`

Then collaboration routes:

- `GET /api/comments`
- `POST /api/comments`
- `PATCH /api/comments/:id`
- `GET /api/documents/:id/versions`
- `POST /api/documents/:id/restore-version`
- `GET /api/activity`

## Frontend plan

Keep the current workbench structure and add collaboration surfaces into it.

Recommended UI additions:

- top-left workspace selector in app shell
- member avatars and roles in header area
- right-side review/comment drawer on document pages
- activity tab on workspace or knowledge page
- unresolved comments badge on documents

Do not redesign the whole app again for collaboration.
Layer collaboration on top of the current workbench patterns.

## Data migration strategy

Because the app currently behaves like a single-user local workspace:

1. Create one default workspace during migration
2. Move all existing records into that workspace
3. Create one bootstrap local user as owner if needed
4. Backfill all `workspaceId` and author references

## Risks

- Overbuilding permissions too early
- Mixing customer collaboration into the first internal-team release
- Trying to solve realtime editing before comments and versions
- Letting AI actions bypass auditability

## Suggested implementation order

1. Prisma schema update for workspace and membership
2. Migration/backfill strategy
3. Auth integration
4. Workspace switcher and member management
5. Workspace-aware data queries
6. Comment system
7. Document version history
8. Activity timeline
9. Review polish and permissions hardening

## Definition of done for V1

V1 is done when:

- users can collaborate inside a shared workspace
- all core data is workspace-scoped
- comments and unresolved review feedback work
- document history and restore work
- actions are attributable to users
- non-members cannot access workspace data

## Suggested starter prompt for a new conversation

Use this in the next session:

```text
Please implement Phase 1 of the multiplayer collaboration plan in docs/superpowers/plans/2026-05-05-multiplayer-collaboration.md.

Context:
- This is DeliverMate AI, a Next.js + Prisma + SQLite app.
- Current core entities are SourceMaterial, AnalysisResult, GeneratedDocument, ChatMessage, KnowledgeAsset, and KnowledgeChunk.
- We want workspace-scoped collaboration, starting with team-internal collaboration only.

Please do the following:
1. Read the multiplayer collaboration plan document first.
2. Update the Prisma schema for Workspace, WorkspaceMember, and workspace scoping of core entities.
3. Add a safe migration/backfill strategy for existing local data.
4. Keep the current app behavior working after the schema change.
5. Run lint, tests, and build at the end.

Before editing, summarize the exact schema changes you plan to make.
```
