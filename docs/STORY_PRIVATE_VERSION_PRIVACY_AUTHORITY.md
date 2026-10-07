# Private story version inventory and deletion verification

The predecessor export/deletion inventory omitted `storyVersions`, which contains private immutable revision snapshots. Inventory v4 adds owner-scoped versions to account and session exports and deletion plans. Completed v3 exports must be regenerated; historical inventory evidence does not prove v4 completeness.

The admin-only deletion verifier validates the stored executed plan hash, request, owner, scope and session binding. It then scans remaining session children even when the deleted parent is absent and reads the exact original target set in pages of 400. This retains visibility of original moderation/public-share targets whose parent metadata has been removed. Ordinary export/planning still requires a live owned parent. A re-created foreign parent fails closed.

Nine fixtures execute the actual callables against synthetic Firestore/Storage/Auth dependencies. Five cases failed against the predecessor, including missing version exports/plans and inability to inspect a deleted session. The repaired cases cover owner isolation, original-target leftovers, inventory regeneration, tampered plan authority and preserved backup-policy hold. These are local behavioral fixtures, not production Firestore contention or backup-provider receipts.

This bounded repair does not certify distributed deletion fences, provider artifact cleanup, family/child retention authority, media cleanup, previously signed URL revocation, backup expiration or production deployment. Existing isolation, legal hold, family, retained-ledger, media, backup and independent launch gates remain required.
