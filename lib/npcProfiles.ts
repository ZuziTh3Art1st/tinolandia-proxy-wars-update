export type NpcPersonality = 'balanced' | 'aggressive' | 'defensive' | 'opportunist';

export interface NpcSettings {
  difficulty: number;
  personality: NpcPersonality;
  aggression: number;
  caution: number;
}

export const DEFAULT_NPC_SETTINGS: NpcSettings = { difficulty: 3, personality: 'balanced', aggression: 50, caution: 50 };
export const NPC_PROFILES = [
  { id: 'npc_1', name: 'Gen. Alvarez', leaders: [{name:'Alexander the Great',note:'Built a short-lived empire through rapid campaigns; conquest brought immense human cost.'},{name:'Simón Bolívar',note:'Led independence campaigns and helped reshape South American states; his centralising ambitions were contested.'}] },
  { id: 'npc_2', name: 'Marshal Okafor', leaders: [{name:'Shaka kaSenzangakhona',note:'A Zulu monarch associated with military and state reforms; accounts of his reign and violence are debated.'},{name:'Queen Nzinga',note:'Ndongo and Matamba ruler who used diplomacy and military resistance against Portuguese expansion and enslavement.'}] },
  { id: 'npc_3', name: 'Adm. Lindqvist', leaders: [{name:'Elizabeth I',note:'English monarch who strengthened state power and naval reach; her reign included colonial expansion and executions.'},{name:'Alfred Thayer Mahan',note:'Naval strategist whose ideas influenced maritime policy; he was not a head of state.'}] },
  { id: 'npc_4', name: 'Cmdr. Tanaka', leaders: [{name:'Tokugawa Ieyasu',note:'Unified political rule in Japan and founded a shogunate; stability came with rigid social control.'},{name:'Emperor Meiji',note:'Oversaw rapid state modernisation; the later imperial system also expanded through war and colonial rule.'}] },
  { id: 'npc_5', name: 'Brig. Petrov', leaders: [{name:'Catherine the Great',note:'Expanded and modernised the Russian Empire while preserving autocratic rule and serfdom.'},{name:'Peter the Great',note:'Reformed and expanded the Russian state through coercive modernisation and wars.'}] },
  { id: 'npc_6', name: 'Gen. Moreau', leaders: [{name:'Julius Caesar',note:'Expanded Roman power and centralised authority, contributing to the end of the Republic.'},{name:'Napoleon Bonaparte',note:'Reformed state institutions and conquered much of Europe; his wars caused mass casualties.'}] },
  { id: 'npc_7', name: 'Col. Haddad', leaders: [{name:'Salah ad-Din (Saladin)',note:'Led Muslim forces and founded the Ayyubid dynasty; accounts of his conduct and legacy vary.'},{name:'Harun al-Rashid',note:'Abbasid caliph during a period of political and cultural influence; rule also relied on imperial hierarchy.'}] },
  { id: 'npc_8', name: 'Adm. Kowalski', leaders: [{name:'Winston Churchill',note:'Led Britain during much of the Second World War; his imperial views and policies caused lasting harm.'},{name:'Mansa Musa',note:'Mali emperor remembered for wealth, pilgrimage and patronage; historical records are partial.'}] },
  { id: 'npc_9', name: 'Marshal Naidoo', leaders: [{name:'Nelson Mandela',note:'Led the anti-apartheid struggle and South Africa’s democratic transition; a political leader, not a military-game archetype.'},{name:'Emperor Ashoka',note:'Mauryan ruler associated with empire-building and later support for Buddhist principles; the record is shaped by imperial sources.'}] },
] as const;

export function normaliseNpcSettings(input: unknown): NpcSettings {
  if (!input || typeof input !== 'object') return { ...DEFAULT_NPC_SETTINGS };
  const value = input as Partial<NpcSettings>;
  const personalities: NpcPersonality[] = ['balanced','aggressive','defensive','opportunist'];
  const clamp = (raw: unknown, fallback: number, low: number, high: number) => Math.max(low, Math.min(high, Number.isFinite(Number(raw)) ? Math.round(Number(raw)) : fallback));
  return {
    difficulty: clamp(value.difficulty, 3, 1, 5),
    personality: personalities.includes(value.personality as NpcPersonality) ? value.personality as NpcPersonality : 'balanced',
    aggression: clamp(value.aggression, 50, 0, 100),
    caution: clamp(value.caution, 50, 0, 100),
  };
}
