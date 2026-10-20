# Dependency audit notes

The project uses the Expo SDK 57 compatibility map and SDK-compatible native packages resolved with `expo install`. The lockfile is committed. The tested runtime is Node 24.22.0.

The installation audit during the SDK 57 migration reports **59 advisories: 12 moderate and 47 high**, including transitive build/test dependencies. This is a known limitation, not a clean security-audit result.

Examples in the dependency graph include:

- `braces`: nested-pattern stack exhaustion ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)); propagated through Metro/micromatch.
- `node-forge`: RSA signature-verification issue ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)); included by Expo signing/tooling dependencies.
- An older transitive `uuid`: buffer-bound checks ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)). Application recipe IDs use `expo-crypto`, not this transitive UUID package.

The previous SDK 58 audit proposed major replacements including Expo 44 and React Native 0.72. Those suggestions were not applied. This project was deliberately moved to SDK 57 for store-distributed Expo Go compatibility. No forced downgrade or unverified dependency override was applied. Audit results may change as upstream releases and advisory data change.

Recheck before distributing a production binary:

```bash
npm audit
npx expo install --check
npx expo-doctor
```

Review compatible upstream patches, rerun the full quality gate, and perform native device QA before release. The application itself does not fetch recipe data or send photos to a server.
