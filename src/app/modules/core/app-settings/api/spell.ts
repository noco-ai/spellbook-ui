export interface SkillStatus {
  skill: string;
  class_name: string;
}

export interface Spell {
  module: string;
  label: string;
  spell_label: string;
  description: string;
  icon: string;
  card: string;
  configuration: any;
  skill_dependencies: Array<string>;
  skill_status: Array<SkillStatus>;
}
