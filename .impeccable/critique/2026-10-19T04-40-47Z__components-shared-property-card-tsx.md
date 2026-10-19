---
target: property cards broker and owner views
total_score: 24
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\components\\shared\\property-card.tsx"
target_fingerprint: "sha256:1ee1c32ed9acf677d6937c7509a7b5d949e6257eb5a547e52063f306a0a4f76d"
target_path: "D:\\Projects\\Office\\broker-new-ui\\components\\shared\\property-card.tsx"
timestamp: 2026-10-19T04-40-47Z
slug: components-shared-property-card-tsx
---

# Property card critique — broker + owner

Method: dual-agent (A: design review · B: detector).
Target: components/shared/property-card.tsx
Score: 24/40
Evidence: source + docs (A); CLI detect clean, no browser (B).

## Design Health Score: 24/40

1 Visibility of System Status: 3
2 Match System / Real World: 3
3 User Control and Freedom: 3
4 Consistency and Standards: 2
5 Error Prevention: 2
6 Recognition Rather Than Recall: 3
7 Flexibility and Efficiency: 2
8 Aesthetic and Minimalist Design: 2
9 Error Recovery: 2
10 Help and Documentation: 2

## Priority Issues

P1 Dead dual implementation (overlay live; list-style subtree unused)
P1 represented variant orphaned
P1 Owner Edit buried in menu
P2 DESIGN drift (violet Private, empty photo copy, chip pile)
P2 Touch-hostile tooltips / hover chrome

Full narrative delivered in chat.
