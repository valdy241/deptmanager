import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Trash2, Pencil, Briefcase } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "En attente", variant: "secondary" },
    in_progress: { label: "En cours", variant: "default" },
    completed: { label: "Terminée", variant: "outline" },
    cancelled: { label: "Annulée", variant: "destructive" },
  };
  const v = map[status] ?? { label: status, variant: "secondary" };
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
    low: "Basse", medium: "Moyenne", high: "Haute", urgent: "Urgente",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[priority] ?? colors.medium}`}>
      {labels[priority] ?? priority}
    </span>
  );
}

export default function TasksPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" as "low" | "medium" | "high" | "urgent", assignedTo: "", dueDate: "" });

  const { data, isLoading, refetch } = trpc.task.list.useQuery({ search: search || undefined, status: statusFilter || undefined });
  const { data: allUsers } = trpc.user.listAll.useQuery();
  const createMutation = trpc.task.create.useMutation({ onSuccess: () => { refetch(); setIsCreateOpen(false); setForm({ title: "", description: "", priority: "medium", assignedTo: "", dueDate: "" }); } });
  const updateMutation = trpc.task.update.useMutation({ onSuccess: () => { refetch(); setEditingTask(null); } });
  const deleteMutation = trpc.task.delete.useMutation({ onSuccess: () => refetch() });

  const canManage = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              Tâches
            </h1>
            <p className="text-muted-foreground">Gérez les tâches et suivez leur avancement</p>
          </div>
          {canManage && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvelle tâche
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nouvelle tâche</DialogTitle>
                  <DialogDescription>Créez une tâche et assignez-la à un utilisateur</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titre de la tâche" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Détails..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priorité</Label>
                      <Select value={form.priority} onValueChange={(v: "low" | "medium" | "high" | "urgent") => setForm({ ...form, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Basse</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date d'échéance</Label>
                      <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Assigné à</Label>
                    <Select value={form.assignedTo} onValueChange={v => setForm({ ...form, assignedTo: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Non assigné</SelectItem>
                        {allUsers?.map(u => (
                          <SelectItem key={u.id} value={String(u.id)}>{u.name ?? u.email ?? `Utilisateur ${u.id}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                  <Button onClick={() => createMutation.mutate({ title: form.title, description: form.description, priority: form.priority, assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined, dueDate: form.dueDate ? new Date(form.dueDate) : undefined })} disabled={createMutation.isPending || !form.title.trim()}>Créer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Assigné à</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucune tâche</TableCell></TableRow>
                  )}
                  {data?.items.map(task => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                      <TableCell><StatusBadge status={task.status} /></TableCell>
                      <TableCell>{allUsers?.find(u => u.id === task.assignedTo)?.name ?? "-"}</TableCell>
                      <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString("fr-FR") : "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Dialog open={editingTask?.id === task.id} onOpenChange={v => !v && setEditingTask(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setEditingTask({ ...task, assignedTo: task.assignedTo ? String(task.assignedTo) : "" })}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader><DialogTitle>Modifier la tâche</DialogTitle></DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2"><Label>Titre</Label><Input value={editingTask?.title ?? ""} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Description</Label><Textarea value={editingTask?.description ?? ""} onChange={e => setEditingTask({ ...editingTask, description: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Statut</Label>
                                    <Select value={editingTask?.status ?? ""} onValueChange={v => setEditingTask({ ...editingTask, status: v })}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">En attente</SelectItem>
                                        <SelectItem value="in_progress">En cours</SelectItem>
                                        <SelectItem value="completed">Terminée</SelectItem>
                                        <SelectItem value="cancelled">Annulée</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Priorité</Label>
                                    <Select value={editingTask?.priority ?? ""} onValueChange={v => setEditingTask({ ...editingTask, priority: v })}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Basse</SelectItem>
                                        <SelectItem value="medium">Moyenne</SelectItem>
                                        <SelectItem value="high">Haute</SelectItem>
                                        <SelectItem value="urgent">Urgente</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Assigné à</Label>
                                  <Select value={editingTask?.assignedTo ? String(editingTask.assignedTo) : ""} onValueChange={v => setEditingTask({ ...editingTask, assignedTo: v ? Number(v) : null })}>
                                    <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">Non assigné</SelectItem>
                                      {allUsers?.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name ?? u.email ?? `Utilisateur ${u.id}`}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingTask(null)}>Annuler</Button>
                                <Button onClick={() => updateMutation.mutate({ id: editingTask.id, title: editingTask.title, description: editingTask.description, status: editingTask.status, priority: editingTask.priority, assignedTo: editingTask.assignedTo })} disabled={updateMutation.isPending}>Enregistrer</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          {canManage && (
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate({ id: task.id })}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
