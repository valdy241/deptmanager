import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, CalendarDays, FileText, Building2, Bell, Clock, CheckCircle2, AlertCircle } from "lucide-react";

function StatCard({ title, value, icon: Icon, colorClass }: { title: string; value: number; icon: typeof Users; colorClass: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-lg ${colorClass} flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "En attente", variant: "secondary" },
    in_progress: { label: "En cours", variant: "default" },
    completed: { label: "Terminée", variant: "outline" },
    cancelled: { label: "Annulée", variant: "destructive" },
  };
  const v = variants[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={v.variant}>{v.label}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    low: "Basse",
    medium: "Moyenne",
    high: "Haute",
    urgent: "Urgente",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[priority] ?? colors.medium}`}>
      {labels[priority] ?? priority}
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.name ?? "Utilisateur"}. Voici un aperçu de votre activité.
          </p>
        </div>

        {isLoading || !stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Utilisateurs" value={stats.counts.users} icon={Users} colorClass="bg-blue-500" />
            <StatCard title="Tâches" value={stats.counts.tasks} icon={Briefcase} colorClass="bg-emerald-500" />
            <StatCard title="Rendez-vous" value={stats.counts.appointments} icon={CalendarDays} colorClass="bg-violet-500" />
            <StatCard title="Documents" value={stats.counts.documents} icon={FileText} colorClass="bg-amber-500" />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Recent Tasks */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Tâches récentes
              </CardTitle>
              <CardDescription>Les 5 dernières tâches créées</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !stats ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : stats.recentTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune tâche pour le moment</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">{task.title}</span>
                        <span className="text-xs text-muted-foreground">{task.description ? task.description.substring(0, 60) + "..." : "Pas de description"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        <TaskStatusBadge status={task.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                À venir
              </CardTitle>
              <CardDescription>Rendez-vous des 7 prochains jours</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !stats ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : stats.upcomingAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun rendez-vous à venir</p>
              ) : (
                <div className="space-y-3">
                  {stats.upcomingAppointments.map(appt => (
                    <div key={appt.id} className="flex flex-col gap-1 p-3 rounded-lg border bg-card">
                      <span className="font-medium text-sm">{appt.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(appt.startTime).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {appt.location && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {appt.location}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              Notifications non lues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !stats ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : stats.unreadNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Toutes les notifications sont lues
              </p>
            ) : (
              <div className="space-y-2">
                {stats.unreadNotifications.map(notif => (
                  <div key={notif.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{notif.title}</span>
                      <span className="text-xs text-muted-foreground">{notif.message}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(notif.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
