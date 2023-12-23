export interface ShotExample {
  input: string;
  output: string;
}

export interface SavedSet {
  name: string;
  shots: ShotExample[];
}
