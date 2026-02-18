import { QuestionEntity } from './question.entity';

export interface SectionEntity {
  id: string;
  questionnaireId: string;
  code: string | null;
  title: string;
  description: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  questions?: QuestionEntity[];
  _count?: { questions: number };
}
