# Game adaptation: codebase-design

Apply deep interfaces and behavior seams alongside the actual engine architecture: Actors/components, Unity components/ScriptableObjects or existing ECS, Godot Nodes/Resources. Preserve asset identities, ownership and serialization. Do not force all engine components into generic service/repository classes or replace a measured data-oriented hot path with polymorphism solely to satisfy a smell heuristic.

Read [shared game policy](../../references/game-workflow/game-policy.md) for host loading, permissions, engine evidence and verification boundaries. This note records a local adaptation; all original sibling resources remain bundled.
