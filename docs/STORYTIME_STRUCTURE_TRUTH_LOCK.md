# Storytime Structure Truth Lock

This document establishes the canonical project structure for `urai-storytime` and outlines the plan for resolving the duplicated and obsolete code.

## 1. Which app root is canonical?

The canonical app root is the **root directory** of the repository. The `package.json`, `next.config.mjs`, and `src` directory at the top level are the correct ones to use.

## 2. Which files/folders are duplicate?

The entire `urai-storytime` directory is a duplicate of the root project. This includes:

- `urai-storytime/urai-storytime` (a nested duplicate)
- `urai-storytime/src`
- `urai-storytime/docs`
- `urai-storytime/functions`
- `urai-storytime/scripts`
- `urai-storytime/tests`

## 3. Which files/folders are obsolete?

The `urai-storytime/src/app.js` and `urai-storytime/src/index.html` appear to be from a vanilla JS implementation and are obsolete in the context of the Next.js application.

## 4. Which files/folders should be preserved?

All files and folders in the root directory should be preserved, with the exception of the `urai-storytime` directory itself.

## 5. What was removed, archived, or left alone?

The `urai-storytime` directory will be removed.

## 6. What Storytime features actually work today?

Based on the file structure, the following features appear to have at least some implementation:

- Story creation (`src/app/create`)
- Story library (`src/app/library`)
- Story replay (`src/app/story/[storyId]`)
- User authentication pages (`src/app/login`, `src/app/signup`)

However, the actual functionality of these features is unknown without running the application.

## 7. What is still missing?

A clear and unified implementation of the core Storytime experience is missing. The duplicated code creates confusion and makes it difficult to determine the true state of the application. The following are likely missing or incomplete:

- A polished and consistent user interface.
- Full implementation of the story creation, reading, and management flows.
- Complete Firebase integration.
- Robust error handling and loading states.
- Mobile responsiveness.

## 8. What commands prove the correct app builds?

The following commands, run from the root directory, will be used to verify the consolidated application:

- `npm install`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
