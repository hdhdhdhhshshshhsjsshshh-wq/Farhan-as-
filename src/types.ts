export type GirlfriendPersona = "adel" | "karin" | "syifa";
export type GirlfriendMood = "manis" | "ngambek" | "marah" | "senang";

export interface Message {
  id: string;
  sender: "user" | "gf" | "system";
  text: string;
  timestamp: string; // e.g. "12:34"
  isRead?: boolean;
  isMoneyTransfer?: boolean;
  transferAmount?: number;
  isMoneyRequest?: boolean;
  requestAmount?: number;
  isResolved?: boolean; // True if player has paid this request
}

export interface GameState {
  persona: GirlfriendPersona;
  girlfriendName: string;
  relationshipScore: number; // 0 to 100
  mood: GirlfriendMood;
  playerBalance: number; // e.g. start with 1,000,000
  gfBalance: number; // money girlfriend has got
  isBlocked: boolean;
  isPutus: boolean;
  hasStarted: boolean;
}

export interface Job {
  id: string;
  title: string;
  desc: string;
  reward: number;
  durationMs: number; // how long it takes
  icon: string;
}
