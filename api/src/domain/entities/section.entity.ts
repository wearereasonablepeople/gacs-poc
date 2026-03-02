import { QuestionEntity } from './question.entity';

export interface SectionEntity {
  id: string;
  questionnaireId: string;
  code: string | null;
  title: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  imageScale: number | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  questions?: QuestionEntity[];
  _count?: { questions: number };
}
