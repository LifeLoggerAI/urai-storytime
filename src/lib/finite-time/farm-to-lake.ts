import {
  FiniteTimeCanonRegistrySchema,
  FiniteTimeShotGraphSchema,
  type FiniteTimeCanonEntry,
  type FiniteTimeShot
} from "./schemas";

const NOW = "2026-07-22T03:00:00.000Z";
const PROJECT_ID = "finite-time";
const OWNER_ID = "founder-owner";
const PRIVATE_CONSENT = {
  autobiographicalUse: true,
  likenessUse: "pending" as const,
  voiceUse: "not-required" as const,
  publicRelease: "blocked" as const,
  capturedAt: NOW,
  authority: "founder" as const
};
const ORDINARY_DIGNITY = { sensitiveTopics: ["none" as const], depiction: "ordinary" as const, guardrails: [] };

function entry(input: Omit<FiniteTimeCanonEntry, "projectId" | "version" | "ownerId" | "privacyClass" | "consent" | "reviewState" | "createdAt" | "updatedAt">): FiniteTimeCanonEntry {
  return {
    ...input,
    projectId: PROJECT_ID,
    version: 1,
    ownerId: OWNER_ID,
    privacyClass: "owner-only",
    consent: PRIVATE_CONSENT,
    reviewState: "approved-for-animatic",
    createdAt: NOW,
    updatedAt: NOW
  };
}

export const FARM_TO_LAKE_CANON_REGISTRY = FiniteTimeCanonRegistrySchema.parse({
  schemaVersion: "finite-time-canon-registry-v1",
  projectId: PROJECT_ID,
  ownerId: OWNER_ID,
  title: "FINITE TIME — Farm to Lake private canon",
  privacyClass: "owner-only",
  sourceAuthority: { type: "private-drive", documentId: "drv_ft_canonical_authority", revision: "2026-07-21-r1" },
  finalRenderingAuthorized: false,
  createdAt: NOW,
  updatedAt: NOW,
  entries: [
    entry({ id: "role-child", kind: "person-role", title: "Child protagonist", summary: "Founder represented during early childhood through junior-high years; exact likeness remains private.", truthClass: "exact", rightsState: "owner-controlled", chronology: { era: "childhood", ageMin: 4, ageMax: 13, uncertaintyNote: "Specific ages vary by memory." }, participantRoleIds: [], evidenceRefs: [{ id: "drv_ft_child_likeness_pending", kind: "photo", truthClass: "pending", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["protagonist"] }),
    entry({ id: "role-mother", kind: "person-role", title: "Mother", summary: "Young mother, dairy-farm worker, helper, reader, and early computer-world companion.", truthClass: "exact", rightsState: "permission-pending", chronology: { era: "childhood" }, participantRoleIds: [], evidenceRefs: [{ id: "drv_ft_mother_likeness_pending", kind: "photo", truthClass: "pending", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["family"] }),
    entry({ id: "role-father", kind: "person-role", title: "Father", summary: "Young father, dairy and hay worker, vehicle-centered family presence, and boat driver.", truthClass: "exact", rightsState: "permission-pending", chronology: { era: "childhood" }, participantRoleIds: [], evidenceRefs: [{ id: "drv_ft_father_later_photo", kind: "photo", truthClass: "exact", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["family"] }),
    entry({ id: "role-brother", kind: "person-role", title: "Older brother", summary: "Older brother represented before and after Marine boot camp; mischievous, protective, and physically transformed by training.", truthClass: "exact", rightsState: "permission-pending", chronology: { era: "childhood-to-young-adult" }, participantRoleIds: [], evidenceRefs: [{ id: "drv_ft_brother_post_marine", kind: "photo", truthClass: "exact", access: "owner-only" }, { id: "drv_ft_brother_later", kind: "photo", truthClass: "exact", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["family"] }),
    entry({ id: "loc-childhood-farm", kind: "location", title: "Childhood dairy farm", summary: "Large East Texas farm with farmhouse, pond, pasture, driveway, dairy structures, hay work, and white milking building.", truthClass: "approximate", rightsState: "owner-controlled", chronology: { era: "early-childhood" }, participantRoleIds: ["role-child", "role-mother", "role-father", "role-brother"], evidenceRefs: [{ id: "drv_ft_farm_aerial", kind: "map", truthClass: "exact", access: "owner-only" }, { id: "drv_ft_farm_house_exterior", kind: "photo", truthClass: "exact", access: "owner-only" }, { id: "drv_ft_farm_removed_structures", kind: "photo", truthClass: "exact", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["farm", "origin"] }),
    entry({ id: "loc-white-milking-bay", kind: "location", title: "White milking bay", summary: "White dairy milking structure; precise interior is reconstructed from type references.", truthClass: "reconstructed", rightsState: "not-applicable", chronology: { era: "early-childhood" }, participantRoleIds: ["role-mother", "role-father"], evidenceRefs: [{ id: "drv_ft_dairy_type_reference", kind: "type-reference", truthClass: "reconstructed", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["dairy"] }),
    entry({ id: "event-cow-tail-ice", kind: "event", title: "Cow tail on the ice", summary: "During icy mornings, Mother held the tail of a trusted cow that pulled her toward the milking area; Father's participation is uncertain.", truthClass: "family-memory", rightsState: "permission-pending", chronology: { era: "early-childhood", uncertaintyNote: "Mother is certain participant; Father may also have done it." }, participantRoleIds: ["role-mother"], evidenceRefs: [{ id: "drv_ft_cow_tail_memory", kind: "firsthand-memory", truthClass: "family-memory", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["ice", "cow", "work"] }),
    entry({ id: "event-scorpion-coveralls", kind: "event", title: "Scorpion in the coveralls", summary: "Father discovered a scorpion in his work coveralls at a small store and removed them completely.", truthClass: "family-memory", rightsState: "permission-pending", chronology: { era: "childhood" }, participantRoleIds: ["role-father"], evidenceRefs: [{ id: "drv_ft_scorpion_memory", kind: "family-memory", truthClass: "family-memory", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["humor"] }),
    entry({ id: "event-house-always-room", kind: "event", title: "The house always had room", summary: "Mother brought home a homeless man to help him; the household became sick, and a later porch firework accident frightened him away.", truthClass: "approximate", rightsState: "anonymize", chronology: { era: "childhood", uncertaintyNote: "Holiday timing may have been New Year's or nearby." }, participantRoleIds: ["role-child", "role-mother", "role-brother"], evidenceRefs: [{ id: "drv_ft_house_room_memory", kind: "firsthand-memory", truthClass: "approximate", access: "owner-only" }], dignity: { sensitiveTopics: ["homelessness"], depiction: "restrained", guardrails: ["Do not ridicule homelessness.", "Comedy belongs to the family chaos, not the guest's vulnerability."] }, tags: ["compassion", "chaos"] }),
    entry({ id: "event-family-cat", kind: "animal", title: "Declawed family cat", summary: "The cat slid on the hallway floor, slid off the old television, and was once accidentally closed in a drawer.", truthClass: "family-memory", rightsState: "not-applicable", chronology: { era: "childhood" }, participantRoleIds: ["role-child", "role-brother"], evidenceRefs: [{ id: "drv_ft_cat_memory", kind: "firsthand-memory", truthClass: "family-memory", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["cat", "humor"] }),
    entry({ id: "event-skeleton-mask", kind: "prop", title: "Skeleton mask", summary: "Older brother repeatedly terrorized the child with a skeleton mask until Father burned it.", truthClass: "family-memory", rightsState: "not-applicable", chronology: { era: "childhood" }, participantRoleIds: ["role-child", "role-brother", "role-father"], evidenceRefs: [{ id: "drv_ft_mask_memory", kind: "firsthand-memory", truthClass: "family-memory", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["mask", "humor"] }),
    entry({ id: "event-myst-with-mother", kind: "technology", title: "Myst with Mother", summary: "Child and Mother explored Myst together on her personal computer, an early shared doorway into a mysterious digital world.", truthClass: "exact", rightsState: "permission-pending", chronology: { era: "computer-childhood" }, participantRoleIds: ["role-child", "role-mother"], evidenceRefs: [{ id: "drv_ft_myst_memory", kind: "firsthand-memory", truthClass: "exact", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["myst", "computer"] }),
    entry({ id: "event-school-mcdonalds", kind: "event", title: "Junior-high McDonald's mornings", summary: "After turning sixteen, Brother drove the child to junior high and they sometimes stopped at McDonald's during the Monopoly promotion.", truthClass: "approximate", rightsState: "permission-pending", chronology: { era: "junior-high", ageMin: 11, ageMax: 14 }, participantRoleIds: ["role-child", "role-brother"], evidenceRefs: [{ id: "drv_ft_school_drive_memory", kind: "firsthand-memory", truthClass: "approximate", access: "owner-only" }, { id: "drv_ft_brother_red_truck_type", kind: "type-reference", truthClass: "approximate", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["truck", "school"] }),
    entry({ id: "event-snake-in-shoe", kind: "event", title: "Snake in the shoe", summary: "After Marine boot camp, Brother placed a dead snake in the child's shoe while two younger cousins pretended to sleep in the living room; the child came from his bedroom while leaving for school.", truthClass: "exact", rightsState: "permission-pending", chronology: { era: "school-years" }, participantRoleIds: ["role-child", "role-brother"], evidenceRefs: [{ id: "drv_ft_snake_memory", kind: "firsthand-memory", truthClass: "exact", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["snake", "brother"] }),
    entry({ id: "loc-lake-of-the-pines", kind: "location", title: "Lake O' the Pines", summary: "The East Texas lake and dam where the family skied and spent time on the water.", truthClass: "exact", rightsState: "not-applicable", chronology: { era: "childhood" }, participantRoleIds: ["role-child", "role-father"], evidenceRefs: [{ id: "drv_ft_lake_dam", kind: "photo", truthClass: "exact", access: "owner-only" }, { id: "drv_ft_lake_shore", kind: "photo", truthClass: "type-reference", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["lake", "water"] }),
    entry({ id: "vehicle-ski-nautique", kind: "vehicle", title: "Family Ski Nautique", summary: "Classic low-profile Ski Nautique type, white hull with blue or teal striping; exact year and trim remain pending.", truthClass: "approximate", rightsState: "not-applicable", chronology: { era: "childhood" }, participantRoleIds: ["role-father", "role-child"], evidenceRefs: [{ id: "drv_ft_ski_nautique_type_a", kind: "type-reference", truthClass: "approximate", access: "owner-only" }, { id: "drv_ft_ski_nautique_type_b", kind: "type-reference", truthClass: "approximate", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["boat", "trust"] }),
    entry({ id: "theme-land-to-water", kind: "theme", title: "Land opens into water", summary: "The opening movement transitions from farm labor and connected systems into lake motion, trust, and childhood freedom.", truthClass: "reconstructed", rightsState: "owner-controlled", chronology: { era: "film-language" }, participantRoleIds: [], evidenceRefs: [{ id: "drv_ft_screenplay_authority", kind: "document", truthClass: "exact", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["theme"] }),
    entry({ id: "sound-gate-to-water", kind: "sound-memory", title: "Gate to water transition", summary: "Wind through grass and metal farm rhythm transform into water against the boat and engine pulse.", truthClass: "reconstructed", rightsState: "owner-controlled", chronology: { era: "film-language" }, participantRoleIds: [], evidenceRefs: [{ id: "drv_ft_sound_bible", kind: "document", truthClass: "exact", access: "owner-only" }], dignity: ORDINARY_DIGNITY, tags: ["sound"] })
  ]
});

const SHOT_DURATION = 6;
function shot(input: Omit<FiniteTimeShot, "durationSeconds" | "renderMethod" | "reviewState" | "privacyClass" | "rightsState">): FiniteTimeShot {
  return {
    ...input,
    durationSeconds: SHOT_DURATION,
    renderMethod: "deterministic-local-proof",
    reviewState: "approved-for-animatic",
    privacyClass: "owner-only",
    rightsState: "permission-pending"
  };
}

const scenes = [
  {
    id: "scene-land-before-water", sequenceId: "seq-farm", order: 1, title: "Before the water", purpose: "Establish the real farm as the child's first living system.", emotionalArc: { enter: "darkness", turn: "recognition", exit: "warmth" },
    shots: [
      shot({ id: "ft-fl-001", sceneId: "scene-land-before-water", order: 1, title: "Farm before sunrise", visual: "Aerial geometry of pasture, farmhouse, pond, driveway and absent dairy footprint emerges from black.", camera: { framing: "aerial", movement: "push", lensMm: 35 }, narration: "Before there was water, there was land.", dialogue: [], canonEntryIds: ["loc-childhood-farm", "theme-land-to-water"], characterRoleIds: [], locationId: "loc-childhood-farm", propIds: [], musicCueId: "cue-land-one", foley: ["distant cattle", "wind through pasture"], caption: "Before there was water, there was land.", audioDescription: "Before sunrise, a large farm surrounds a farmhouse and pond.", haptics: [{ atSeconds: 1, pattern: "soft-pulse", intensity: 0.2 }], truthClass: "reconstructed" }),
      shot({ id: "ft-fl-002", sceneId: "scene-land-before-water", order: 2, title: "White milking bay", visual: "The white milking structure glows in blue-gray dawn as cattle move toward it.", camera: { framing: "wide", movement: "track", lensMm: 40 }, narration: "My mother and father had a dairy farm. Morning arrived whether anybody was ready or not.", dialogue: [], canonEntryIds: ["loc-white-milking-bay", "loc-childhood-farm"], characterRoleIds: ["role-mother", "role-father"], locationId: "loc-white-milking-bay", propIds: [], musicCueId: "cue-land-one", foley: ["gate rattle", "hooves", "dairy motor"], caption: "My mother and father had a dairy farm.", audioDescription: "Cattle file toward a white milking building in the cold dawn.", haptics: [{ atSeconds: 2, pattern: "texture", intensity: 0.25 }], truthClass: "reconstructed" }),
      shot({ id: "ft-fl-003", sceneId: "scene-land-before-water", order: 3, title: "Child at the doorway", visual: "A very young child watches the living farm from the farmhouse doorway.", camera: { framing: "medium", movement: "locked", lensMm: 65 }, narration: "I was too young to understand that somebody else was holding the whole world together around me.", dialogue: [], canonEntryIds: ["role-child", "loc-childhood-farm"], characterRoleIds: ["role-child"], locationId: "loc-childhood-farm", propIds: [], musicCueId: "cue-land-one", foley: ["screen door", "morning birds"], caption: "Somebody else was holding the whole world together.", audioDescription: "A small child watches from the open farmhouse door.", haptics: [], truthClass: "reconstructed" })
    ]
  },
  {
    id: "scene-ice-and-cow", sequenceId: "seq-farm", order: 2, title: "The cow knew the way", purpose: "Show work, trust, and mutual dependence without mythologizing hardship.", emotionalArc: { enter: "cold", turn: "struggle", exit: "shared-motion" },
    shots: [
      shot({ id: "ft-fl-004", sceneId: "scene-ice-and-cow", order: 1, title: "Frozen grade", visual: "Ice coats the incline to the milking bay; boots slide while cattle keep moving.", camera: { framing: "wide", movement: "tilt", lensMm: 32 }, narration: "When the ground iced over, my mom still had to get the cows up to be milked.", dialogue: [], canonEntryIds: ["event-cow-tail-ice", "loc-white-milking-bay"], characterRoleIds: ["role-mother"], locationId: "loc-white-milking-bay", propIds: [], musicCueId: "cue-ice", foley: ["boot scrape", "cold wind", "cow breath"], caption: "When the ground iced over, the cows still had to be milked.", audioDescription: "A woman slips on an icy slope behind moving cattle.", haptics: [{ atSeconds: 1, pattern: "texture", intensity: 0.35 }], truthClass: "family-memory" }),
      shot({ id: "ft-fl-005", sceneId: "scene-ice-and-cow", order: 2, title: "Take the tail", visual: "A gloved hand carefully grips the trusted cow's tail.", camera: { framing: "extreme-close", movement: "locked", lensMm: 85 }, narration: "There was a certain cow she could depend on.", dialogue: [], canonEntryIds: ["event-cow-tail-ice"], characterRoleIds: ["role-mother"], locationId: "loc-white-milking-bay", propIds: [], musicCueId: "cue-ice", foley: ["leather glove", "animal breath"], caption: "There was a certain cow she could depend on.", audioDescription: "A gloved hand closes gently around a cow's tail.", haptics: [{ atSeconds: 2, pattern: "soft-pulse", intensity: 0.3 }], truthClass: "family-memory" }),
      shot({ id: "ft-fl-006", sceneId: "scene-ice-and-cow", order: 3, title: "Pulled uphill", visual: "The cow climbs steadily while Mother slides, regains balance, and follows into warm light.", camera: { framing: "medium", movement: "track", lensMm: 50 }, narration: "She held on, and the cow pulled her up toward the milking place.", dialogue: [], canonEntryIds: ["event-cow-tail-ice"], characterRoleIds: ["role-mother"], locationId: "loc-white-milking-bay", propIds: [], musicCueId: "cue-ice", foley: ["hooves on ice", "boots sliding", "milking room hum"], caption: "The cow pulled her up toward the milking place.", audioDescription: "The cow steadily pulls the slipping woman uphill into the barn light.", haptics: [{ atSeconds: 1, pattern: "rising", intensity: 0.45 }], truthClass: "family-memory" })
    ]
  },
  {
    id: "scene-farm-work", sequenceId: "seq-farm", order: 3, title: "Everything depended on something", purpose: "Define the connected labor system that later echoes URAI.", emotionalArc: { enter: "rhythm", turn: "scale", exit: "connection" },
    shots: [
      shot({ id: "ft-fl-007", sceneId: "scene-farm-work", order: 1, title: "Hay rows", visual: "A green tractor follows long hay rows across open East Texas pasture.", camera: { framing: "extreme-wide", movement: "pan", lensMm: 28 }, narration: "The land, the weather, the hay, the cattle, the work, the family—nothing existed completely by itself.", dialogue: [], canonEntryIds: ["loc-childhood-farm"], characterRoleIds: ["role-father"], locationId: "loc-childhood-farm", propIds: ["tractor-green", "hay-rake"], musicCueId: "cue-work", foley: ["diesel engine", "hay rake"], caption: "Nothing existed completely by itself.", audioDescription: "A green tractor works long rows of cut hay.", haptics: [{ atSeconds: 1, pattern: "texture", intensity: 0.25 }], truthClass: "reconstructed" }),
      shot({ id: "ft-fl-008", sceneId: "scene-farm-work", order: 2, title: "Milking line", visual: "Cows stand in a practical milking line; pipes, concrete and repeated motion create a mechanical rhythm.", camera: { framing: "wide", movement: "track", lensMm: 35 }, narration: "Everything living needed attention.", dialogue: [], canonEntryIds: ["loc-white-milking-bay"], characterRoleIds: ["role-mother", "role-father"], locationId: "loc-white-milking-bay", propIds: ["milking-stalls"], musicCueId: "cue-work", foley: ["vacuum pump", "metal latch", "water on concrete"], caption: "Everything living needed attention.", audioDescription: "Cows stand side by side in a working milking line.", haptics: [{ atSeconds: 2, pattern: "double-pulse", intensity: 0.2 }], truthClass: "reconstructed" }),
      shot({ id: "ft-fl-009", sceneId: "scene-farm-work", order: 3, title: "Dust in sunlight", visual: "A child's fingers drag across a hay bale; dust rises into gold morning light.", camera: { framing: "close", movement: "push", lensMm: 75 }, narration: "I did not have words for systems. I was a little boy standing in the middle of one.", dialogue: [], canonEntryIds: ["role-child", "loc-childhood-farm"], characterRoleIds: ["role-child"], locationId: "loc-childhood-farm", propIds: ["hay-bale"], musicCueId: "cue-work", foley: ["hay fibers", "soft wind"], caption: "I was a little boy standing in the middle of one.", audioDescription: "A child's hand brushes hay as dust glows in sunlight.", haptics: [{ atSeconds: 3, pattern: "soft-pulse", intensity: 0.2 }], truthClass: "reconstructed" })
    ]
  },
  {
    id: "scene-family-chaos", sequenceId: "seq-family", order: 4, title: "Compassion and chaos", purpose: "Let the audience know the family through warmth and absurdity.", emotionalArc: { enter: "kindness", turn: "disaster", exit: "laughter" },
    shots: [
      shot({ id: "ft-fl-010", sceneId: "scene-family-chaos", order: 1, title: "An open door", visual: "Mother opens the farmhouse door to a tired anonymous traveler and sets a place at the table.", camera: { framing: "medium", movement: "push", lensMm: 50 }, narration: "My mom was always trying to help somebody. She saw a person who needed help and opened the door.", dialogue: [], canonEntryIds: ["event-house-always-room", "role-mother"], characterRoleIds: ["role-mother"], locationId: "loc-childhood-farm", propIds: ["kitchen-table"], musicCueId: "cue-house", foley: ["door hinge", "plate on table"], caption: "She saw a person who needed help and opened the door.", audioDescription: "A woman welcomes a tired stranger into the farmhouse.", haptics: [{ atSeconds: 1, pattern: "soft-pulse", intensity: 0.25 }], truthClass: "approximate" }),
      shot({ id: "ft-fl-011", sceneId: "scene-family-chaos", order: 2, title: "Everybody sick", visual: "The family lies under blankets throughout the living room, coughing in miserable unison.", camera: { framing: "wide", movement: "locked", lensMm: 35 }, narration: "Then the whole damn family got sick. Not a little sick.", dialogue: [], canonEntryIds: ["event-house-always-room"], characterRoleIds: ["role-child", "role-mother", "role-father", "role-brother"], locationId: "loc-childhood-farm", propIds: ["blankets"], musicCueId: "cue-house-comedy", foley: ["layered coughs", "medicine bottle"], caption: "Then the whole family got sick.", audioDescription: "Blanketed family members fill the living room, coughing.", haptics: [{ atSeconds: 2, pattern: "double-pulse", intensity: 0.2 }], truthClass: "approximate" }),
      shot({ id: "ft-fl-012", sceneId: "scene-family-chaos", order: 3, title: "Porch guided missile", visual: "A firework ricochets beneath the porch and appears to chase the fleeing guest as children scatter.", camera: { framing: "wide", movement: "handheld", lensMm: 28 }, narration: "It looked less like a celebration and more like the world's cheapest guided missile.", dialogue: [], canonEntryIds: ["event-house-always-room"], characterRoleIds: ["role-child", "role-brother"], locationId: "loc-childhood-farm", propIds: ["porch", "firework"], musicCueId: "cue-house-comedy", foley: ["fuse", "ricochet", "distant pop", "nervous laughter"], caption: "The world's cheapest guided missile.", audioDescription: "A bouncing firework sends everyone running from the porch.", haptics: [{ atSeconds: 2, pattern: "impact", intensity: 0.65 }, { atSeconds: 4, pattern: "impact", intensity: 0.5 }], truthClass: "approximate" })
    ]
  },
  {
    id: "scene-cat-and-mask", sequenceId: "seq-family", order: 5, title: "The physics of childhood", purpose: "Build affectionate family mythology through physical comedy and fear resolved by a parent.", emotionalArc: { enter: "play", turn: "fear", exit: "safety" },
    shots: [
      shot({ id: "ft-fl-013", sceneId: "scene-cat-and-mask", order: 1, title: "Cat versus hallway", visual: "The declawed cat sprints, tries to stop and slides into a closed door with offended dignity.", camera: { framing: "wide", movement: "track", lensMm: 35 }, narration: "Gravity remained undefeated.", dialogue: [], canonEntryIds: ["event-family-cat"], characterRoleIds: ["role-child", "role-brother"], locationId: "loc-childhood-farm", propIds: ["hallway-door"], musicCueId: "cue-cat", foley: ["paws scrambling", "soft thump", "children laughing"], caption: "Gravity remained undefeated.", audioDescription: "A small cat slides along the hallway and bumps softly into a door.", haptics: [{ atSeconds: 3, pattern: "impact", intensity: 0.25 }], truthClass: "family-memory" }),
      shot({ id: "ft-fl-014", sceneId: "scene-cat-and-mask", order: 2, title: "Cat versus television", visual: "The cat leaps toward the old television, fails to grip and slowly slides down the glass.", camera: { framing: "medium", movement: "locked", lensMm: 50 }, narration: "No phone. No algorithm. Just two brothers and a cat discovering it still did not have claws.", dialogue: [], canonEntryIds: ["event-family-cat"], characterRoleIds: ["role-child", "role-brother"], locationId: "loc-childhood-farm", propIds: ["old-television"], musicCueId: "cue-cat", foley: ["cat leap", "paws on glass", "laughter"], caption: "No phone. No algorithm.", audioDescription: "The cat slowly slides down the front of an old television.", haptics: [{ atSeconds: 2, pattern: "texture", intensity: 0.2 }], truthClass: "family-memory" }),
      shot({ id: "ft-fl-015", sceneId: "scene-cat-and-mask", order: 3, title: "Mask to fire", visual: "A skeleton mask looms from a dark doorway; the image cuts to Father dropping it into a controlled burn barrel.", camera: { framing: "close", movement: "pull", lensMm: 70 }, narration: "My brother terrorized me with that mask until my dad finally burned the damn thing.", dialogue: [], canonEntryIds: ["event-skeleton-mask"], characterRoleIds: ["role-child", "role-brother", "role-father"], locationId: "loc-childhood-farm", propIds: ["skeleton-mask", "burn-barrel"], musicCueId: "cue-mask", foley: ["mask breath", "fire crackle"], caption: "My dad finally burned the mask.", audioDescription: "A frightening skeleton mask dissolves into flames inside a burn barrel.", haptics: [{ atSeconds: 1, pattern: "impact", intensity: 0.4 }, { atSeconds: 4, pattern: "soft-pulse", intensity: 0.2 }], truthClass: "family-memory" })
    ]
  },
  {
    id: "scene-digital-door", sequenceId: "seq-digital", order: 6, title: "A world inside the screen", purpose: "Connect Mother, mystery and the first explorable digital world.", emotionalArc: { enter: "quiet", turn: "wonder", exit: "possibility" },
    shots: [
      shot({ id: "ft-fl-016", sceneId: "scene-digital-door", order: 1, title: "Mother's PC", visual: "A beige personal computer glows in a dim room; Mother and child lean toward the screen together.", camera: { framing: "medium", movement: "push", lensMm: 55 }, narration: "Before Quake, there was Myst on my mom's PC.", dialogue: [], canonEntryIds: ["event-myst-with-mother", "role-mother", "role-child"], characterRoleIds: ["role-mother", "role-child"], locationId: "loc-childhood-farm", propIds: ["beige-pc", "crt-monitor"], musicCueId: "cue-myst", foley: ["computer fan", "mouse click", "crt hum"], caption: "Before Quake, there was Myst on my mom's PC.", audioDescription: "A mother and child sit together before a glowing old computer.", haptics: [{ atSeconds: 2, pattern: "soft-pulse", intensity: 0.15 }], truthClass: "exact" }),
      shot({ id: "ft-fl-017", sceneId: "scene-digital-door", order: 2, title: "Island doorway", visual: "The CRT image becomes an abstract island of gears, water and impossible architecture, clearly labeled as memory reconstruction.", camera: { framing: "pov", movement: "push", lensMm: 35 }, narration: "It was not just a game. It felt like a place waiting for us to understand it.", dialogue: [], canonEntryIds: ["event-myst-with-mother"], characterRoleIds: [], locationId: "loc-childhood-farm", propIds: ["crt-monitor"], musicCueId: "cue-myst", foley: ["page turn", "distant mechanism", "water"], caption: "It felt like a place waiting for us to understand it.", audioDescription: "The computer screen opens into a dreamlike reconstructed island.", haptics: [{ atSeconds: 3, pattern: "rising", intensity: 0.3 }], truthClass: "reconstructed" }),
      shot({ id: "ft-fl-018", sceneId: "scene-digital-door", order: 3, title: "Shared discovery", visual: "Mother points at a detail; child smiles as the screen light moves across both faces.", camera: { framing: "close", movement: "orbit", lensMm: 75 }, narration: "My mother was there at one of the first doors I ever opened into a digital world.", dialogue: [], canonEntryIds: ["event-myst-with-mother"], characterRoleIds: ["role-mother", "role-child"], locationId: "loc-childhood-farm", propIds: ["crt-monitor"], musicCueId: "cue-myst", foley: ["quiet laugh", "mouse click"], caption: "She was there at one of the first digital doors I opened.", audioDescription: "Mother and child share a smile in the computer's light.", haptics: [{ atSeconds: 4, pattern: "soft-pulse", intensity: 0.25 }], truthClass: "reconstructed" })
    ]
  },
  {
    id: "scene-school-mornings", sequenceId: "seq-brother", order: 7, title: "Red truck mornings", purpose: "Give the brothers a specific everyday rhythm before military seriousness.", emotionalArc: { enter: "morning", turn: "ritual", exit: "affection" },
    shots: [
      shot({ id: "ft-fl-019", sceneId: "scene-school-mornings", order: 1, title: "Truck at dawn", visual: "A red regular-cab short-bed street truck waits outside the farm house before school.", camera: { framing: "wide", movement: "pan", lensMm: 40 }, narration: "When my brother turned sixteen, he started driving me to junior high.", dialogue: [], canonEntryIds: ["event-school-mcdonalds", "role-brother"], characterRoleIds: ["role-brother", "role-child"], locationId: "loc-childhood-farm", propIds: ["red-short-bed-truck"], musicCueId: "cue-truck", foley: ["truck idle", "door close"], caption: "He started driving me to junior high.", audioDescription: "A red short-bed pickup idles outside the farmhouse at dawn.", haptics: [{ atSeconds: 1, pattern: "texture", intensity: 0.2 }], truthClass: "approximate" }),
      shot({ id: "ft-fl-020", sceneId: "scene-school-mornings", order: 2, title: "Monopoly breakfast", visual: "Two brothers unwrap breakfast in the truck while bright game pieces and paper coupons remain generic and unbranded.", camera: { framing: "medium", movement: "locked", lensMm: 50 }, narration: "We would stop for breakfast during that Monopoly game shit, like every little piece might change our lives.", dialogue: [], canonEntryIds: ["event-school-mcdonalds"], characterRoleIds: ["role-child", "role-brother"], locationId: "loc-childhood-farm", propIds: ["red-short-bed-truck", "breakfast-bag", "game-piece"], musicCueId: "cue-truck", foley: ["paper bag", "wrapper", "truck radio murmur"], caption: "Every little game piece might change our lives.", audioDescription: "The brothers eat breakfast in the parked truck and examine a game piece.", haptics: [], truthClass: "reconstructed" }),
      shot({ id: "ft-fl-021", sceneId: "scene-school-mornings", order: 3, title: "School drop-off", visual: "The child steps out at junior high; the red truck pulls away into morning traffic.", camera: { framing: "wide", movement: "pull", lensMm: 45 }, narration: "At the time it was just a ride to school. Years later, it became one of the places memory kept him.", dialogue: [], canonEntryIds: ["event-school-mcdonalds", "role-brother"], characterRoleIds: ["role-child", "role-brother"], locationId: "loc-childhood-farm", propIds: ["red-short-bed-truck", "school-backpack"], musicCueId: "cue-truck", foley: ["school morning", "truck accelerating"], caption: "Years later, memory kept him there.", audioDescription: "The child watches the red pickup leave the school entrance.", haptics: [{ atSeconds: 4, pattern: "soft-pulse", intensity: 0.2 }], truthClass: "reconstructed" })
    ]
  },
  {
    id: "scene-snake-shoe", sequenceId: "seq-brother", order: 8, title: "The Marine and the snake", purpose: "Introduce Brother's post-boot-camp body and unchanged mischievous identity.", emotionalArc: { enter: "ordinary", turn: "shock", exit: "laughter" },
    shots: [
      shot({ id: "ft-fl-022", sceneId: "scene-snake-shoe", order: 1, title: "Leaving for school", visual: "The child exits his bedroom dressed for school; Brother and two younger cousins lie in sleeping bags in the living room.", camera: { framing: "wide", movement: "track", lensMm: 35 }, narration: "I slept in my room. They were in the living room pretending to be asleep while I was heading out the door.", dialogue: [], canonEntryIds: ["event-snake-in-shoe"], characterRoleIds: ["role-child", "role-brother"], locationId: "loc-childhood-farm", propIds: ["sleeping-bags", "school-shoes"], musicCueId: "cue-snake", foley: ["bedroom door", "quiet room", "shoe leather"], caption: "They were pretending to be asleep.", audioDescription: "A school-dressed child passes three sleeping bags on the way to the door.", haptics: [], truthClass: "exact" }),
      shot({ id: "ft-fl-023", sceneId: "scene-snake-shoe", order: 2, title: "Something in the shoe", visual: "His foot stops inside the shoe; he pulls it off, reaches in and lifts a dead snake in disbelief.", camera: { framing: "close", movement: "push", lensMm: 70 }, narration: "My foot hit something that absolutely did not belong inside a shoe.", dialogue: [], canonEntryIds: ["event-snake-in-shoe"], characterRoleIds: ["role-child"], locationId: "loc-childhood-farm", propIds: ["school-shoe", "dead-snake"], musicCueId: "cue-snake", foley: ["shoe drop", "sharp inhale"], caption: "There was a dead snake in my shoe.", audioDescription: "He pulls a dead snake from his shoe and recoils.", haptics: [{ atSeconds: 2, pattern: "impact", intensity: 0.6 }], truthClass: "exact" }),
      shot({ id: "ft-fl-024", sceneId: "scene-snake-shoe", order: 3, title: "Too big to beat up", visual: "Brother fails to hide a smile; the child charges, but the newly returned Marine holds him away with one arm as cousins laugh.", camera: { framing: "medium", movement: "handheld", lensMm: 40 }, narration: "I was going to beat his ass. He had just come home from Marine boot camp. I could not. But I damn sure tried.", dialogue: [], canonEntryIds: ["event-snake-in-shoe", "role-brother"], characterRoleIds: ["role-child", "role-brother"], locationId: "loc-childhood-farm", propIds: ["sleeping-bags", "dead-snake"], musicCueId: "cue-snake-release", foley: ["cousins laughing", "playful struggle"], caption: "I could not. But I damn sure tried.", audioDescription: "The much larger brother laughs and holds the furious child at arm's length.", haptics: [{ atSeconds: 3, pattern: "double-pulse", intensity: 0.3 }], truthClass: "exact" })
    ]
  },
  {
    id: "scene-land-to-water", sequenceId: "seq-lake", order: 9, title: "The land opens", purpose: "Transform farm sound and visual language into water without announcing later trauma.", emotionalArc: { enter: "nostalgia", turn: "absence", exit: "opening" },
    shots: [
      shot({ id: "ft-fl-025", sceneId: "scene-land-to-water", order: 1, title: "What remains", visual: "Present-day field where dairy structures once stood; the land is open and quiet.", camera: { framing: "extreme-wide", movement: "locked", lensMm: 45 }, narration: "The farm became a place I could mostly return to through memory.", dialogue: [], canonEntryIds: ["loc-childhood-farm", "theme-land-to-water"], characterRoleIds: [], locationId: "loc-childhood-farm", propIds: [], musicCueId: "cue-absence", foley: ["wind through grass", "distant road"], caption: "The farm became a place I could mostly return to through memory.", audioDescription: "An empty field remains where the dairy structures once stood.", haptics: [{ atSeconds: 3, pattern: "soft-pulse", intensity: 0.2 }], truthClass: "exact" }),
      shot({ id: "ft-fl-026", sceneId: "scene-land-to-water", order: 2, title: "Sound bridge", visual: "Tall grass bends; its movement dissolves into sunlight moving across lake water.", camera: { framing: "close", movement: "pull", lensMm: 65 }, narration: "Then, somewhere inside those early years, the land opened into water.", dialogue: [], canonEntryIds: ["theme-land-to-water", "sound-gate-to-water", "loc-lake-of-the-pines"], characterRoleIds: [], locationId: "loc-lake-of-the-pines", propIds: [], musicCueId: "cue-transition", foley: ["grass wind becoming water", "distant boat engine"], caption: "The land opened into water.", audioDescription: "Wind through grass dissolves into rippling lake water.", haptics: [{ atSeconds: 2, pattern: "rising", intensity: 0.3 }], truthClass: "reconstructed" }),
      shot({ id: "ft-fl-027", sceneId: "scene-land-to-water", order: 3, title: "Lake reveal", visual: "Lake O' the Pines opens wide beneath clean sky, with the dam structure held in the distance.", camera: { framing: "extreme-wide", movement: "crane", lensMm: 28 }, narration: "Lake O' the Pines.", dialogue: [], canonEntryIds: ["loc-lake-of-the-pines"], characterRoleIds: [], locationId: "loc-lake-of-the-pines", propIds: [], musicCueId: "cue-lake", foley: ["water", "shore birds", "engine far away"], caption: "Lake O' the Pines.", audioDescription: "A broad East Texas lake stretches beneath a clear sky.", haptics: [{ atSeconds: 4, pattern: "soft-pulse", intensity: 0.25 }], truthClass: "exact" })
    ]
  },
  {
    id: "scene-ski-nautique", sequenceId: "seq-lake", order: 10, title: "Pulled forward", purpose: "End the chapter on trust, motion and childhood freedom.", emotionalArc: { enter: "anticipation", turn: "acceleration", exit: "freedom" },
    shots: [
      shot({ id: "ft-fl-028", sceneId: "scene-ski-nautique", order: 1, title: "Boat at the dock", visual: "A white classic Ski Nautique with blue-teal striping rocks beside the dock; exact trim remains intentionally approximate.", camera: { framing: "wide", movement: "orbit", lensMm: 40 }, narration: "We had a Ski Nautique. Low, white, blue along the side—the kind of boat built to pull you out of stillness.", dialogue: [], canonEntryIds: ["vehicle-ski-nautique", "loc-lake-of-the-pines"], characterRoleIds: ["role-father", "role-child"], locationId: "loc-lake-of-the-pines", propIds: ["ski-nautique", "tow-rope"], musicCueId: "cue-lake", foley: ["hull against dock", "rope creak", "engine start"], caption: "The kind of boat built to pull you out of stillness.", audioDescription: "A white and blue classic ski boat rocks beside the dock.", haptics: [{ atSeconds: 3, pattern: "double-pulse", intensity: 0.25 }], truthClass: "approximate" }),
      shot({ id: "ft-fl-029", sceneId: "scene-ski-nautique", order: 2, title: "Rope in hand", visual: "The child's hands tighten around a tow rope while Father looks back from the driver's seat.", camera: { framing: "close", movement: "push", lensMm: 75 }, narration: "Before I understood how quickly a life could change, I knew what it felt like to be pulled forward by somebody I trusted.", dialogue: [], canonEntryIds: ["vehicle-ski-nautique", "role-child", "role-father"], characterRoleIds: ["role-child", "role-father"], locationId: "loc-lake-of-the-pines", propIds: ["tow-rope", "ski-nautique"], musicCueId: "cue-trust", foley: ["rope tension", "engine rising", "water around legs"], caption: "Pulled forward by somebody I trusted.", audioDescription: "The child grips a tow rope as his father checks on him from the boat.", haptics: [{ atSeconds: 2, pattern: "rising", intensity: 0.45 }], truthClass: "reconstructed" }),
      shot({ id: "ft-fl-030", sceneId: "scene-ski-nautique", order: 3, title: "Across the water", visual: "The child rises and glides across bright water behind the Ski Nautique; land and sky stretch into one open horizon.", camera: { framing: "extreme-wide", movement: "track", lensMm: 32 }, narration: "For a little while, the world was sunlight, water, rope, engine, and the certainty that he would keep driving.", dialogue: [], canonEntryIds: ["vehicle-ski-nautique", "loc-lake-of-the-pines", "theme-land-to-water"], characterRoleIds: ["role-child", "role-father"], locationId: "loc-lake-of-the-pines", propIds: ["ski-nautique", "tow-rope"], musicCueId: "cue-trust", foley: ["wake spray", "boat engine", "child laughter"], caption: "Sunlight. Water. Rope. Engine. Trust.", audioDescription: "The child glides behind the boat across sparkling open water.", haptics: [{ atSeconds: 1, pattern: "rising", intensity: 0.5 }, { atSeconds: 5, pattern: "soft-pulse", intensity: 0.25 }], truthClass: "reconstructed" })
    ]
  }
];

export const FARM_TO_LAKE_SHOT_GRAPH = FiniteTimeShotGraphSchema.parse({
  schemaVersion: "finite-time-shot-graph-v1",
  projectId: PROJECT_ID,
  chapterId: "farm-to-lake",
  version: 1,
  ownerId: OWNER_ID,
  title: "FINITE TIME — Farm to Lake deterministic animatic",
  privacyClass: "owner-only",
  renderMode: "deterministic-local-proof",
  finalRenderingAuthorized: false,
  targetDurationSeconds: 180,
  sequences: [
    { id: "seq-farm", order: 1, title: "The living farm" },
    { id: "seq-family", order: 2, title: "The house always had room" },
    { id: "seq-digital", order: 3, title: "The first digital doorway" },
    { id: "seq-brother", order: 4, title: "Brotherhood in motion" },
    { id: "seq-lake", order: 5, title: "The land opens into water" }
  ],
  scenes,
  createdAt: NOW,
  updatedAt: NOW
});

export function createRedactedFarmToLakeHandoff() {
  return {
    schemaVersion: "finite-time-redacted-handoff-v1",
    projectId: FARM_TO_LAKE_SHOT_GRAPH.projectId,
    chapterId: FARM_TO_LAKE_SHOT_GRAPH.chapterId,
    version: FARM_TO_LAKE_SHOT_GRAPH.version,
    renderMode: FARM_TO_LAKE_SHOT_GRAPH.renderMode,
    finalRenderingAuthorized: false,
    durationSeconds: FARM_TO_LAKE_SHOT_GRAPH.targetDurationSeconds,
    sequences: FARM_TO_LAKE_SHOT_GRAPH.sequences,
    scenes: FARM_TO_LAKE_SHOT_GRAPH.scenes.map((scene) => ({
      id: scene.id,
      sequenceId: scene.sequenceId,
      order: scene.order,
      title: scene.title,
      purpose: scene.purpose,
      shots: scene.shots.map((item) => ({
        id: item.id,
        sceneId: item.sceneId,
        order: item.order,
        durationSeconds: item.durationSeconds,
        title: item.title,
        visual: item.visual,
        camera: item.camera,
        narration: item.narration,
        caption: item.caption,
        audioDescription: item.audioDescription,
        haptics: item.haptics,
        musicCueId: item.musicCueId,
        foley: item.foley,
        truthClass: item.truthClass,
        renderMethod: item.renderMethod,
        sourceAuthorityIds: item.canonEntryIds
      }))
    }))
  };
}
