
# Data Flow Diagrams

This document details the sequence of data flow for critical operations within the Storytime application. It should be read in conjunction with the System Architecture document.

## Flow 1: New User Registration & Family Creation

This flow describes how a new user signs up and creates their initial family and child profile.

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Next.js App
    participant Auth as Firebase Auth
    participant Functions as Cloud Functions API
    participant DB as Cloud Firestore

    User->>Frontend: Clicks "Sign Up"
    Frontend->>Auth: Initiates OAuth flow (e.g., Google Sign-In)
    Auth-->>User: Completes authentication
    Auth-->>Frontend: Returns JWT and User Profile
    Frontend->>Functions: Calls `createFamily` (Authenticated Request)
    activate Functions
    Functions->>DB: `create` new document in `/families/{familyId}`
    Note right of Functions: Sets `ownerUid` to user's auth UID.
    DB-->>Functions: Confirms creation
    Functions-->>Frontend: Returns `{ success: true, familyId: newId }`
    deactivate Functions
    User->>Frontend: Enters child's name
    Frontend->>Functions: Calls `createChild` (Authenticated Request with familyId)
    activate Functions
    Functions->>DB: `get` `/families/{familyId}` to verify ownership
    DB-->>Functions: Returns family doc
    Functions->>Functions: Confirms `ownerUid` matches caller's UID
    Functions->>DB: `create` new document in `/families/{familyId}/children/{childId}`
    DB-->>Functions: Confirms creation
    Functions-->>Frontend: Returns `{ success: true, childId: newId }`
    deactivate Functions
```

## Flow 2: Story Generation

This flow describes the process of a user generating a new, personalized story for a child.

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Next.js App
    participant Functions as Cloud Functions API
    participant DB as Cloud Firestore

    User->>Frontend: Selects Child and Story Template, Clicks "Generate"
    Frontend->>Functions: Calls `generateStory` ({familyId, childId, templateId})
    activate Functions
    Functions->>DB: `get` `/families/{familyId}` to verify ownership
    DB-->>Functions: Returns family doc
    Functions->>Functions: Confirms `ownerUid` matches caller's UID (CRITICAL CHECK)
    Functions->>DB: `create` new document in `/families/{familyId}/stories/{storyId}`
    Note right of Functions: Story has `status: "processing"`
    DB-->>Functions: Confirms creation
    Functions-->>Frontend: Returns `{ storyId: newId, theme: ... }`
    deactivate Functions
    
    Note over Frontend, Functions: The function would now typically trigger a separate worker for the actual content generation (e.g., calling an AI model and a Text-to-Speech service). This is out of scope for the current implementation, but the data flow for the user-facing API is complete.
```

## Flow 3: Story Playback

This flow describes how a user retrieves the details needed to play back a previously generated story.

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Next.js App
    participant Functions as Cloud Functions API
    participant DB as Cloud Firestore
    participant Storage as Cloud Storage

    User->>Frontend: Clicks "Play Story"
    Frontend->>Functions: Calls `getStoryPlaybackDetails` ({familyId, storyId})
    activate Functions
    Functions->>DB: `get` `/families/{familyId}` to verify ownership
    DB-->>Functions: Returns family doc
    Functions->>Functions: Confirms `ownerUid` matches caller's UID (CRITICAL CHECK)
    Functions->>DB: `get` `/families/{familyId}/stories/{storyId}`
    DB-->>Functions: Returns story document
    Functions->>Storage: Generates a short-lived Signed URL for the story's audio file path
    Storage-->>Functions: Returns Signed URL
    Functions-->>Frontend: Returns `{ storyTitle: "...", audioUrl: "..." }`
    deactivate Functions
    Frontend->>Storage: Requests audio file using the Signed URL
    Storage-->>Frontend: Serves the audio file directly and securely
```
