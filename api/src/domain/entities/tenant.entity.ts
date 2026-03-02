export interface TenantEntity {
  id: string;
  slug: string;
  name: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  headerTextColor: string | null;
  subtextColor: string | null;
  startButtonColor: string | null;
  previousButtonColor: string | null;
  nextQuestionButtonColor: string | null;
  prevQuestionButtonColor: string | null;
  stepNavBgColor: string | null;
  stepNavTextColor: string | null;
  progressBarBgColor: string | null;
  progressBarColor: string | null;
  progressBarTextColor: string | null;
  questionContainerBgColor: string | null;
  activeChapterIndicatorColor: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  verificationEmailTemplate: string | null;
  notificationEmail: string | null;
  isActive: boolean;
  retentionDays: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
