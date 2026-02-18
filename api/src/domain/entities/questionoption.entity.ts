export interface QuestionOptionEntity {
  id: string;
  questionId: string;
  label: string;
  groupLabel: string | null;
  isAllowed: boolean | null;
  displayOrder: number;
  createdAt: Date;
}
