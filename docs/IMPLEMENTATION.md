# Implementation plan

Savour is an offline Expo application for Android and iOS. The existing GitHub history is preserved.

1. Initialize the official TypeScript starter and publish a working baseline.
2. Add typed data, bundled imagery, serialized persistence and shared recipe state.
3. Implement native-stack navigation, recipe cards, category filtering and details.
4. Implement a reusable validated editor, persistent gallery images and deletion.
5. Test failure handling and CRUD, polish accessibility, document and package submission.

Storage will use a versioned JSON envelope. A missing key seeds samples; an empty collection stays empty. Reads validate records and fail visibly without replacing corrupt data. Mutations execute in a serialized queue and only publish state after persistence succeeds. Gallery selections are copied into the document directory before committing a recipe.

Device QA requires full Xcode or Android tooling, or a physical device with compatible Expo Go. Bundling is not a substitute for native device testing.
