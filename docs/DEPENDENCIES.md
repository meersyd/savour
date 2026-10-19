# Dependency audit notes

The project uses the stable Expo SDK 58 template and SDK-compatible native packages resolved with `expo install`. The lockfile is committed. The tested runtime is Node 24.22.0.

The installation audit on 19 October 2026 reports **50 advisories: 25 moderate and 25 high**, including transitive build/test dependencies. This is a known limitation, not a clean security-audit result.

Examples in the dependency graph include:

- `braces`: nested-pattern stack exhaustion ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)); propagated through Metro/micromatch.
- `node-forge`: RSA signature-verification issue ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)); included by Expo signing/tooling dependencies.
- An older transitive `uuid`: buffer-bound checks ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)). Application recipe IDs use `expo-crypto`, not this transitive UUID package.

The audit's proposed automatic major replacements included Expo 44 and React Native 0.72, incompatible with this application's SDK 58 pairing. No forced downgrade or unverified dependency override was applied. Audit results may change as upstream releases and advisory data change.

Recheck before distributing a production binary:

```bash
npm audit
npx expo install --check
npx expo-doctor
```

Review compatible upstream patches, rerun the full quality gate, and perform native device QA before release. The application itself does not fetch recipe data or send photos to a server.
