export type StoryTemplate = {
    id: string;
    text: string;
    theme: "calm" | "rest" | "uncertainty" | "belonging";
  };
  
  export const STORY_TEMPLATES: StoryTemplate[] = [
    {
      id: "path_waiting",
      theme: "uncertainty",
      text: [
        "The forest was already awake…",
        "",
        "Light rested between the trees,",
        "not in a hurry to go anywhere.",
        "",
        "There was a path that didn’t ask to be followed.",
        "It simply waited.",
        "",
        "The forest didn’t need to decide tonight.",
        "",
        "Leaves shifted softly.",
        "Nothing was lost by waiting."
      ].join("\n")
    },
    {
      id: "quiet_clearing",
      theme: "rest",
      text: [
        "A clearing opened gently in the forest.",
        "",
        "Nothing needed to happen there.",
        "",
        "The ground felt steady.",
        "The air felt kind.",
        "",
        "Sitting was enough for now."
      ].join("\n")
    },
    {
      id: "slow_forest",
      theme: "calm",
      text: [
        "The forest moved more slowly today.",
        "",
        "Leaves took their time falling.",
        "",
        "Nothing hurried.",
        "",
        "Even the light rested a little longer."
      ].join("\n")
    },
    {
      id: "between_trees",
      theme: "belonging",
      text: [
        "Between the trees, there was space.",
        "",
        "Enough space to breathe.",
        "",
        "Enough space to belong.",
        "",
        "The forest made room without asking."
      ].join("\n")
    }
  ];
  