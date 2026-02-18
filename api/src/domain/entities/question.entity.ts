import { QuestionOptionEntity } from './questionoption.entity';

export interface QuestionEntity {
  id: string;
  sectionId: string;
  code: string | null;
  prompt: string;
  helpText: string | null;
  isRequired: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  options?: QuestionOptionEntity[];
}
