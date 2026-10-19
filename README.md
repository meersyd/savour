# Savour — Recipe Manager

A warm, offline recipe book for Android and iOS. Save the dishes you love, organise them by category, and keep every ingredient and cooking step close at hand.

Built for the React Native Application Developer assessment at FOURTITUDE ASIA.

**Public repository:** https://github.com/meersyd/savour

## Features

- Six starter recipes with bundled food photography; no remote images or backend required.
- Responsive recipe cards with category, preparation time, and servings.
- Native category Picker populated directly from `src/data/recipetypes.json`, including an **All Recipes** filter.
- Complete create, read, update, and delete flows with immediate shared-state updates.
- One reusable add/edit form for names, descriptions, categories, photos, timings, servings, ingredients, and instructions.
- Individually editable/removable ingredient and step rows; arrows reorder cooking steps.
- Gallery selection with permanent application-owned image copies.
- Required-field validation, accessible controls, saving feedback, duplicate-submit protection, and unsaved-change confirmation.
- Confirmed deletion, missing-recipe handling, loading indicators, empty states, and visible storage errors.
- Safe-area layouts, keyboard handling, scrolling, tablet columns, large-text adaptation, and portrait/landscape support.

## Stack

| Area        | Technology                                                          |
| ----------- | ------------------------------------------------------------------- |
| Framework   | Expo SDK 58, React Native 0.88, React 19.3                          |
| Language    | TypeScript 6, strict mode                                           |
| Navigation  | React Navigation 7 Native Stack                                     |
| State       | React Context and custom `useRecipes` hook                          |
| Persistence | AsyncStorage with a serialized repository                           |
| Photos      | Expo Image Picker, Expo FileSystem                                  |
| UI          | React Native StyleSheet, Safe Area Context, native Picker, Ionicons |
| Quality     | ESLint, Prettier, Jest Expo, React Native Testing Library           |

Use **Node.js 24 LTS (24.3 or newer within the 24.x line)**. Versions are recorded in `package-lock.json`; use `npm ci` for reproducible installation. Expo SDK compatibility is checked with Expo Doctor.

## Installation

```bash
git clone https://github.com/meersyd/savour.git
cd savour
nvm install 24
nvm use 24
npm ci
npm start
```

If you do not use `nvm`, install Node 24 LTS directly before running `npm ci`. No `.env` file, API key, account, or backend configuration is needed.

### Run with Expo Go

A development build is **not required for the core application**: its native modules are available in a compatible **Expo Go for SDK 58**. Install the compatible Expo Go version on your device, start Metro with `npm start`, and scan the QR code. The computer and phone normally need to share a network for development.

- **Android:** scan the QR code in Expo Go, or press `a` in Metro with a configured emulator running.
- **iOS:** scan the QR code using the Camera app, or press `i` in Metro on a Mac with a full Xcode installation and an iOS Simulator.

Expo Go must support this project's SDK. If the installed Expo Go version is incompatible, use a compatible version or build locally as described below. Expo Go supplies its own application identity and permission messages; standalone builds apply Savour's icon and permission configuration.

### Build and run locally

For the actual Savour application identity, install Android Studio/Android SDK with an emulator (Android), or full Xcode and CocoaPods on macOS (iOS), then run:

```bash
# Android native debug build
npm run android

# iOS native debug build — macOS with Xcode required
npm run ios
```

These scripts use `expo run:android` and `expo run:ios` and generate native projects when needed. Generated `android/` and `ios/` folders are intentionally ignored; native configuration lives in `app.json`. For SDK 58's exact native toolchain requirements, see the [Expo SDK reference](https://docs.expo.dev/versions/v58.0.0/).

An installed standalone build keeps the core recipe features available without a network. Expo Go and debug builds still need the development bundle/Metro when starting a development session. Nothing is published to an app store by these commands.

## Architecture

```text
App.tsx                         SafeAreaProvider, recipe provider, navigation
src/
  components/                   Buttons, cards, Picker, shared form, editable rows
  screens/                      Listing, detail, and add/edit screens
  navigation/AppNavigator.tsx   Typed Native Stack
  hooks/useRecipes.ts           Typed access to shared recipe state
  context/RecipeContext.tsx     Loading/error state and committed recipe snapshots
  services/
    recipeRepository.ts         Storage abstraction, validation, serialized CRUD
    recipeStorage.ts            AsyncStorage + UUID production adapter
    recipeImages.ts             Permanent photo copying and URI resolution
  data/recipetypes.json          Single source of category options
  data/sampleRecipes.json       First-initialization recipes
  types/recipe.ts                Recipe, form, and navigation models
  constants/theme.ts            Shared colours and styles
  utils/                        Validation and bundled image resolution
assets/images/                  Offline recipe photographs and credits
tests/                          Persistence, image, and component interaction tests
scripts/generate-icons.ts       Reproducible original app icon
```

`RecipeRepository` encapsulates persistence behind an injected `StorageAdapter`. Screens never call AsyncStorage directly. Its private queue orders reads and mutations so concurrent operations cannot replace a newer collection with an older snapshot. A failed operation does not poison the queue.

The provider publishes a new collection only after persistence succeeds. `useRecipes` exposes `recipes`, `loading`, `error`, `refresh`, `createRecipe`, `updateRecipe`, and `deleteRecipe`. Memoized filtering and callbacks keep stateful concerns separate from presentation. The form owns its draft, while the screen coordinates persistence and navigation.

## Local JSON and initialization

`src/data/recipetypes.json` contains objects with `id` and `name`. Both filtering and editing import this same file; category options are never duplicated in screen code.

`src/data/sampleRecipes.json` contains six recipes spanning the six categories. Each `categoryId` matches the category JSON. Bundled image references use `sample:<id>` and are resolved through static image imports in `src/utils/images.ts`. Photography source links are in [assets/images/CREDITS.md](assets/images/CREDITS.md).

Samples are written only when the storage key is **absent**. An existing empty array represents an intentionally empty collection and is never reseeded. Updating sample JSON in a later app version does not overwrite an existing collection.

## Persistence and CRUD

The AsyncStorage key `@savour/recipes/v1` stores a versioned envelope:

```json
{ "version": 1, "recipes": [] }
```

- **Create:** validate the draft, copy a selected image into documents, generate a UUID and timestamps, then persist and publish the new collection.
- **Read:** validate the storage envelope and each recipe before exposing it to the UI.
- **Update:** replace editable fields while retaining the original ID and creation timestamp. The list and detail view share the updated collection.
- **Delete:** require a native confirmation dialog, persist removal, and return to the listing. Repeated deletion is safe; missing details show a friendly message.
- **Failures:** display an error and retain the previous persisted snapshot. Corrupt or unsupported records are never silently replaced with samples. Retry is available; no automatic destructive reset is provided.

Gallery images are copied into `Paths.document/recipe-images/` before saving. Storage keeps a relative `local:<filename>` reference, resolved against the current documents directory. This avoids temporary-picker URI expiry and stale absolute iOS sandbox paths. A failed recipe write attempts to remove its newly copied photo. Existing photos remain available during edits.

Records and photos remain on the device. Clearing application data or uninstalling the app removes the collection; there is no cloud sync or export/backup feature.

## Validation and tests

```bash
# TypeScript, lint, formatting, and all automated tests
npm run check

# Individual checks
npm run typecheck
npm run lint
npm run format:check
npm test
npx expo-doctor

# Compile production JS/Hermes bundles for both platforms
npx expo export --platform android --output-dir dist/android
npx expo export --platform ios --output-dir dist/ios

# Validate native project generation without installing native dependencies
npx expo prebuild --no-install
```

**Verified:** 33 tests in three suites, strict type checking, lint, formatting, Expo Doctor (20/20), Android/iOS bundle exports, and native project generation. Tests cover first initialization, restarts, empty collections, concurrent writes, failure recovery, corruption, photo copying, filtering, form interaction, delete confirmation, and application-shell navigation.

Native modules and gallery responses are mocked in automated tests. **No physical-device, emulator, simulator, signed-binary, or native compilation test was performed.** This environment has only Xcode command-line tools and no Android SDK/emulator. See [docs/QA.md](docs/QA.md) for the scenario-by-scenario evidence and remaining device checks. Bundle export and prebuild are not substitutes for a native build or device test.

No application screenshots are included because a real native display was not available; no mock screenshots are presented as app captures.

## Known limitations

- Device checks are still needed for actual photo permissions, gallery cropping, keyboard behavior, VoiceOver/TalkBack, rotation, and native lifecycle persistence.
- Replaced or deleted recipes' previously saved photos are retained in the app's private document directory. This prioritizes data safety but can accumulate unused images; future maintenance can add transactional garbage collection.
- The app targets Android and iOS. Browser/web support is not part of this submission.
- Unsupported/corrupt storage requires investigation or an explicit device-data reset; recovery never erases a user's data automatically.
- The dependency audit reports upstream advisories in the Expo/Metro and test-tool dependency trees. See [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md). The SDK was not forcibly downgraded to satisfy incompatible audit suggestions.

## Source ZIP

The submission ZIP includes the lockfile, source, bundled assets, tests, and documentation. It excludes dependencies, Git metadata, native generated projects, development caches, credentials, and generated bundles.

To reproduce it from a committed checkout:

```bash
mkdir -p submission
git archive --format=zip --prefix=Savour/ --output=submission/Savour-source.zip HEAD
python3 scripts/verify-archive.py submission/Savour-source.zip
```

The archive represents committed source, so commit intended changes before packaging. `submission/` is ignored and is not recursively included.

## Development history

The original repository commit was retained. The Expo baseline was pushed before feature development. Data/persistence, browsing, editing/images, deletion, QA, and documentation were developed and pushed as separate milestones. Review the authentic history with:

```bash
git log --oneline --reverse
```
