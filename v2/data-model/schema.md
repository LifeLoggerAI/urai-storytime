# Storytime V2 Data Model

This document defines the Firestore data model for Storytime V2. All collections and fields are designed to be compliant with the project's privacy and safety requirements.

---

### 1. Families Collection (`/families`)

Represents the family unit. This is the top-level document for a group of users.

**Document ID:** `familyId` (auto-generated)

| Field             | Type      | Description                                                                 |
| ----------------- | --------- | --------------------------------------------------------------------------- |
| `guardianIds`     | `array`   | List of `userIds` for the parents or guardians in the family.               |
| `childIds`        | `array`   | List of `childIds` associated with this family.                             |
| `subscription`    | `map`     | Information about the family's subscription status.                         |
| `createdAt`       | `timestamp` | The timestamp when the family document was created.                         |

---

### 2. Children Collection (`/children`)

Represents a child user profile. All personally identifiable information is abstracted away.

**Document ID:** `childId` (auto-generated)

| Field             | Type      | Description                                                                 |
| ----------------- | --------- | --------------------------------------------------------------------------- |
| `familyId`        | `string`  | The ID of the family this child belongs to.                                 |
| `ageGroup`        | `string`  | The child's age group (e.g., "3-5", "6-8"). Used for content filtering.   |
| `companion`       | `map`     | Data related to the child's non-verbal companion.                           |
| `progression`     | `map`     | The child's story progression data (see below).                             |
| `createdAt`       | `timestamp` | The timestamp when the child document was created.                            |

---

### 3. Stories Collection (`/stories`)

A collection of all available stories, pre-generated and approved.

**Document ID:** `storyId` (auto-generated)

| Field             | Type      | Description                                                                 |
| ----------------- | --------- | --------------------------------------------------------------------------- |
| `title`           | `string`  | The title of the story.                                                     |
| `ageGroups`       | `array`   | An array of age groups this story is suitable for (e.g., ["3-5"]).        |
| `audioUrl`        | `string`  | The URL to the static MP3 audio file in Cloud Storage.                      |
| `tags`            | `array`   | Tags for thematic categorization (e.g., ["friendship", "nature"]).        |
| `lengthInSeconds` | `number`  | The duration of the story in seconds.                                       |

---

### 4. Progression Sub-Collection (`/children/{childId}/progression`)

Tracks the stories a child has listened to. This is a sub-collection of the `children` collection.

**Document ID:** `storyId`

| Field             | Type      | Description                                                                 |
| ----------------- | --------- | --------------------------------------------------------------------------- |
| `listenedAt`      | `timestamp` | The timestamp when the child listened to the story.                         |
| `repetitions`     | `number`  | The number of times the child has listened to this story.                   |
