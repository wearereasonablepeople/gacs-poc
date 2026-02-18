import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  CheckCircle2,
  FileText,
  Send,
  Users,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    questionnaires?: number;
    users?: number;
    respondents?: number;
  };
  questionnairesCount?: number;
  usersCount?: number;
  respondentsCount?: number;
  submissionsCount?: number;
}

export function DashboardPage() {
  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await api.get('/tenants');
      return res.data.tenants ?? res.data;
    },
  });

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.isActive !== false).length;
  const inactiveTenants = totalTenants - activeTenants;

  const totalQuestionnaires = tenants.reduce(
    (sum, t) => sum + (t._count?.questionnaires ?? t.questionnairesCount ?? 0),
    0,
  );
  const totalSubmissions = tenants.reduce(
    (sum, t) => sum + (t.submissionsCount ?? 0),
    0,
  );
  const totalRespondents = tenants.reduce(
    (sum, t) => sum + (t._count?.respondents ?? t.respondentsCount ?? 0),
    0,
  );

  const recentTenants = [...tenants]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const chartData = tenants
    .map((t) => ({
      name: t.name.length > 12 ? t.name.slice(0, 12) + '...' : t.name,
      submissions: t.submissionsCount ?? 0,
      questionnaires: t._count?.questionnaires ?? t.questionnairesCount ?? 0,
    }))
    .slice(0, 10);

  const stats = [
    {
      title: 'Total Tenants',
      value: totalTenants,
      description: `${activeTenants} active, ${inactiveTenants} inactive`,
      icon: Building2,
      color: 'text-blue-500',
    },
    {
      title: 'Active Tenants',
      value: activeTenants,
      description: 'Currently active',
      icon: CheckCircle2,
      color: 'text-emerald-500',
    },
    {
      title: 'Questionnaires',
      value: totalQuestionnaires,
      description: 'Across all tenants',
      icon: FileText,
      color: 'text-violet-500',
    },
    {
      title: 'Submissions',
      value: totalSubmissions,
      description: 'Total submissions',
      icon: Send,
      color: 'text-orange-500',
    },
    {
      title: 'Respondents',
      value: totalRespondents,
      description: 'Total respondents',
      icon: Users,
      color: 'text-pink-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[380px] rounded-lg" />
          <Skeleton className="h-[380px] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and metrics
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submissions per Tenant</CardTitle>
            <CardDescription>Distribution of submissions across tenants</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(215 20.2% 65.1%)"
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(215 20.2% 65.1%)"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222.2 84% 4.9%)',
                      border: '1px solid hsl(217.2 32.6% 17.5%)',
                      borderRadius: '8px',
                      color: 'hsl(210 40% 98%)',
                    }}
                  />
                  <Bar
                    dataKey="submissions"
                    fill="hsl(217.2 91.2% 59.8%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No data available yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Tenants</CardTitle>
            <CardDescription>Latest tenants added to the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTenants.length > 0 ? (
              <div className="space-y-4">
                {recentTenants.map((tenant, i) => (
                  <div key={tenant.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {tenant.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={tenant.isActive !== false ? 'success' : 'destructive'}>
                          {tenant.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {i < recentTenants.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No tenants yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
