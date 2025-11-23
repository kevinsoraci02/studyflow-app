

export const calculateLevelFromXP = (lifetime_xp: number): number => {
  // Progressive curve using Lifetime XP
  return Math.max(1, Math.floor(Math.sqrt(lifetime_xp / 100)) + 1);
};

export const calculateXPForNextLevel = (currentLevel: number): number => {
  return 100 * Math.pow(currentLevel, 2);
};

export const calculateXPForCurrentLevel = (currentLevel: number): number => {
  return 100 * Math.pow(currentLevel - 1, 2);
};

export const calculateProgress = (lifetime_xp: number): number => {
  const level = calculateLevelFromXP(lifetime_xp);
  const startXP = calculateXPForCurrentLevel(level);
  const endXP = calculateXPForNextLevel(level);
  
  const totalNeeded = endXP - startXP;
  const earnedInLevel = lifetime_xp - startXP;
  
  if (totalNeeded === 0) return 100;
  return Math.min(100, Math.max(0, (earnedInLevel / totalNeeded) * 100));
};

export const calculateSessionXP = (minutes: number): number => {
  let xp = minutes * 10;
  if (minutes >= 45) xp *= 1.5;
  else if (minutes >= 25) xp *= 1.2;
  return Math.round(xp);
};