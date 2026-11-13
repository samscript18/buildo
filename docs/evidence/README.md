# Actual application evidence

These images were captured from the running Buildo application, not generated mockups. Models are genuine Lux3D outputs delivered from Cloudinary. Browser scenes/accounts are explicitly isolated test records; complete bedroom screenshots use a read-only copy of the user's original saved layout at revision 39. The verification scripts never publish or overwrite the real bedroom.

- [Complete bedroom, light](bedroom-light.png) and [dark](bedroom-dark.png): genuine table, bed and TV console with procedural linen wallpaper.
- [Source scene and model metadata](bedroom-verification.json): original transforms, source revision, task IDs, original bounds, normalization, byte sizes and SHA-256s; exact reload restoration passed.
- [Bed pointer-drag/save/reload report](bed-verification.json): actual Move/Rotate/Resize, undo/redo and snapped movement saved to MongoDB; camera reset comparison; genuine Cloudinary CORS/model delivery.
- [Move](bed-controls-move.png), [Rotate](bed-controls-rotate.png), [Resize](bed-controls-resize.png), [Snap](bed-controls-snap.png): real pointer interactions with the genuine bed.
- [Bed with wallpaper after reload](bed-wallpaper-restored.png).
- [TV console from its original front angle](tv-console-restored.png) and [its real delivery/save/reload report](tv-verification.json).
- [Settings overview](settings-overview.png) and [mobile privacy settings](settings-privacy-mobile.png): GrantPath-inspired layout, isolated test account.

See [the detailed evidence record](../STUDIO_BEDROOM_EVIDENCE.md) for commands, prompts, actual results and limitations. [manifest.json](manifest.json) records file sizes and hashes. Secrets, authentication tokens and signed provider URLs are excluded.
