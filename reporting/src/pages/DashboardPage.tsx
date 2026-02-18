import { useQuery } from '@tanstack/react-query';
import { BarChart3, FileText, Inbox, UserCheck, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface TenantStats {
  totalQuestionnaires: number;
  totalSubmissions: number;
  verifiedRespondents: number;
  recentSubmissions30d: number;
  recentSubmissions: Array<{
    id: string;
    respondentEmail: string;
    questionnaireName: string;
    status: string;
    createdAt: string;
  }>;
  submissionsByDay?: Array<{ date: string; count: number }>;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<TenantStats>({
    queryKey: ['tenant-stats', user?.tenantId],
    queryFn: async () => {
      const { data } = await api.get(`/tenants/${user!.tenantId}/stats`);
      return data;
    },
    enabled: !!user?.tenantId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Questionnaires',
      value: stats?.totalQuestionnaires ?? 0,
      icon: FileText,
      description: 'Published and draft',
    },
    {
      title: 'Total Submissions',
      value: stats?.totalSubmissions ?? 0,
      icon: Inbox,
      description: 'All time submissions',
    },
    {
      title: 'Verified Respondents',
      value: stats?.verifiedRespondents ?? 0,
      icon: UserCheck,
      description: 'Email verified',
    },
    {
      title: 'Recent Submissions',
      value: stats?.recentSubmissions30d ?? 0,
      icon: TrendingUp,
      description: 'Last 30 days',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your tenant activity</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {stats?.submissionsByDay && stats.submissionsByDay.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Submissions Over Time
            </CardTitle>
            <CardDescription>Daily submissions for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.submissionsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(210 100% 20%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>Latest submissions across all questionnaires</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Respondent</TableHead>
                  <TableHead>Questionnaire</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.respondentEmail}</TableCell>
                    <TableCell>{submission.questionnaireName}</TableCell>
                    <TableCell>
                      <Badge variant={submission.status === 'completed' ? 'default' : 'secondary'}>
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No submissions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
