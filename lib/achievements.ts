/**
 * Tinolandia Achievements System
 *
 * Tracks player progress across campaigns and unlocks soldier armour collectibles.
 * Data is stored in localStorage (per-browser, single-player vs NPCs).
 */

export type AchievementId =
  | 'first_blood'
  | 'conqueror'
  | 'world_conqueror'
  | 'tactician'
  | 'eliminator'
  | 'bloodthirsty'
  | 'unstoppable'
  | 'survivor';

export interface Achievement {
  id: AchievementId;
  title: string;
  subtitle: string;
  description: string;
  // Armour collectible tied to this achievement
  armourKit: {
    level: number;
    name: string;
    type: string;
    model: string | null;
    detail: string;
  };
  // How to unlock
  requirement: string;
  // Check if unlocked based on player stats
  unlockedBy: (stats: PlayerStats) => boolean;
}

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  conquests: number;
  battlesWon: number;
  roundsSurvived: number;
  rivalsEliminated: number;
  lastPlayed?: string;
}

export const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  conquests: 0,
  battlesWon: 0,
  roundsSurvived: 0,
  rivalsEliminated: 0,
};

const STORAGE_KEY = 'tinolandia-achievements';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    title: 'First Blood',
    subtitle: 'Win your first battle',
    description: 'Win a single battle round against a rival nation.',
    requirement: 'Win 1 battle round',
    armourKit: {
      level: 2,
      name: 'Field veteran',
      type: 'Chalcidian',
      model: '/assets/armor/Chalcidian.glb',
      detail: 'Battle tested · veteran tier',
    },
    unlockedBy: (s) => s.battlesWon >= 1,
  },
  {
    id: 'conqueror',
    title: 'Conqueror',
    subtitle: 'Conquer 5 countries',
    description: 'Seize 5 enemy territories in total across all campaigns.',
    requirement: 'Conquer 5 countries',
    armourKit: {
      level: 3,
      name: 'Veteran guard',
      type: 'Chalcidian',
      model: '/assets/armor/Chalcidian.glb',
      detail: 'Senior formation · advanced tier',
    },
    unlockedBy: (s) => s.conquests >= 5,
  },
  {
    id: 'tactician',
    title: 'Tactician',
    subtitle: 'Survive 10 rounds',
    description: 'Keep your nation alive for 10 campaign rounds.',
    requirement: 'Survive 10 rounds',
    armourKit: {
      level: 4,
      name: 'Elite guard',
      type: 'Chalcidian',
      model: '/assets/armor/Chalcidian.glb',
      detail: 'Elite formation · specialist tier',
    },
    unlockedBy: (s) => s.roundsSurvived >= 10,
  },
  {
    id: 'eliminator',
    title: 'Eliminator',
    subtitle: 'Eliminate 3 rivals',
    description: 'Wipe out 3 rival commanders completely.',
    requirement: 'Eliminate 3 rival nations',
    armourKit: {
      level: 5,
      name: 'Sovereign guard',
      type: 'Plate armour',
      model: null,
      detail: 'Highest rank · ceremonial tier (Sketchfab)',
    },
    unlockedBy: (s) => s.rivalsEliminated >= 3,
  },
  {
    id: 'world_conqueror',
    title: 'World Conqueror',
    subtitle: 'Win a campaign',
    description: 'Conquer all 10 nations and claim victory.',
    requirement: 'Win 1 campaign',
    armourKit: {
      level: 1,
      name: 'Line soldier',
      type: 'Breastplate',
      model: '/assets/armor/Breastplate.glb',
      detail: 'Standard issue · entry level',
    },
    unlockedBy: (s) => s.wins >= 1,
  },
  {
    id: 'bloodthirsty',
    title: 'Bloodthirsty',
    subtitle: 'Win 5 battles',
    description: 'Win 5 individual battle rounds.',
    requirement: 'Win 5 battle rounds',
    armourKit: {
      level: 2,
      name: 'Field veteran',
      type: 'Chalcidian',
      model: '/assets/armor/Chalcidian.glb',
      detail: 'Battle tested · veteran tier',
    },
    unlockedBy: (s) => s.battlesWon >= 5,
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    subtitle: 'Conquer 3 countries in one game',
    description: 'Seize 3 enemy territories in a single campaign.',
    requirement: 'Conquer 3 countries in one game',
    armourKit: {
      level: 3,
      name: 'Veteran guard',
      type: 'Chalcidian',
      model: '/assets/armor/Chalcidian.glb',
      detail: 'Senior formation · advanced tier',
    },
    unlockedBy: (s) => s.conquests >= 3, // simplified; per-game tracking would need game stats
  },
  {
    id: 'survivor',
    title: 'Survivor',
    subtitle: 'Play 10 campaigns',
    description: 'Complete 10 full campaigns (win or lose).',
    requirement: 'Play 10 campaigns',
    armourKit: {
      level: 4,
      name: 'Elite guard',
      type: 'Chalcidian',
      model: '/assets/armor/Chalcidian.glb',
      detail: 'Elite formation · specialist tier',
    },
    unlockedBy: (s) => s.gamesPlayed >= 10,
  },
];

// Level 1 Breastplate is always unlocked (default kit)
const ALWAYS_UNLOCKED = new Set(['line_soldier'] as const);

export function loadStats(): PlayerStats {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

function saveStats(stats: PlayerStats) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore quota errors
  }
}

export function getUnlockedAchievements(stats: PlayerStats): AchievementId[] {
  return ACHIEVEMENTS.filter((a) => a.unlockedBy(stats)).map((a) => a.id);
}

export function isArmourKitUnlocked(kitLevel: number, stats: PlayerStats): boolean {
  // Level 1 is always unlocked
  if (kitLevel <= 1) return true;
  const unlockedIds = getUnlockedAchievements(stats);
  const kit = ACHIEVEMENTS.find((a) => a.armourKit.level === kitLevel && unlockedIds.includes(a.id));
  return !!kit;
}

export function getNextLockedKit(stats: PlayerStats): { level: number; name: string; requirement: string } | null {
  const unlockedIds = getUnlockedAchievements(stats);
  for (const ach of ACHIEVEMENTS) {
    if (!unlockedIds.includes(ach.id)) {
      return {
        level: ach.armourKit.level,
        name: ach.title,
        requirement: ach.requirement,
      };
    }
  }
  return null;
}

export function recordGameResult(opts: {
  won: boolean;
  conquests: number;
  battlesWon: number;
  roundsSurvived: number;
  rivalsEliminated: number;
}) {
  const stats = loadStats();
  stats.gamesPlayed += 1;
  if (opts.won) stats.wins += 1;
  else stats.losses += 1;
  stats.conquests += opts.conquests;
  stats.battlesWon += opts.battlesWon;
  stats.roundsSurvived += opts.roundsSurvived;
  stats.rivalsEliminated += opts.rivalsEliminated;
  stats.lastPlayed = new Date().toISOString();
  saveStats(stats);
  return stats;
}

export function loadArmourKitLevel(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const stored = Number(window.localStorage.getItem('tinolandia-soldier-kit-level'));
    if (stored >= 1 && stored <= 5) return stored;
  } catch {
    // ignore
  }
  return 1;
}

export function saveArmourKitLevel(level: number) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('tinolandia-soldier-kit-level', String(Math.max(1, Math.min(5, level))));
  } catch {
    // ignore
  }
}
