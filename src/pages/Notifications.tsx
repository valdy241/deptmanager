import { trpc } from "@/providers/trpc";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCircle2, Trash2, Briefcase, CalendarDays, FileText, Users, Info } from "lucide-react";

function NotificationIcon({ type }: { type: string }) {
  const icons: Record<string, typeof Bell> = {
    task: Briefcase,
    appointment: CalendarDays,
    document: FileText,
    user: Users,
    system: Info,
  };
  const Icon = icons[type] ?? Bell;
  return <Icon className="h-5 w-5 text-primary" />;
}

export default function NotificationsPage() {
  const { data, isLoading, refetch } = trpc.notification.list.useQuery();
  const markRead = trpc.notification.markAsRead.useMutation({ onSuccess: () => refetch() });
  const markAllRead = trpc.notification.markAllAsRead.useMutation({ onSuccess: () => refetch() });
  const deleteNotif = trpc.notification.delete.useMutation({ onSuccess: () => refetch() });

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notifications
            </h1>
            <p className="text-muted-foreground">Consultez vos notifications et alertes</p>
          </div>
          {(data?.unreadCount ?? 0) > 0 && (
            <Button variant="outline" className="gap-2" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : data?.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Aucune notification</p>
                <p className="text-sm text-muted-foreground">Vous n'avez pas encore de notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.items.map(notif => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${notif.isRead ? "bg-card" : "bg-primary/5 border-primary/20"}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <NotificationIcon type={notif.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{notif.title}</h4>
                        {!notif.isRead && <Badge variant="default" className="h-5 text-[10px]">Nouveau</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!notif.isRead && (
                        <Button variant="ghost" size="icon" onClick={() => markRead.mutate({ id: notif.id })} title="Marquer comme lu">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteNotif.mutate({ id: notif.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
