import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, Trash2, Pencil, Users } from "lucide-react";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data, isLoading, refetch } = trpc.user.list.useQuery({ search: search || undefined, role: roleFilter || undefined });
  const createMutation = trpc.user.create.useMutation({ onSuccess: () => { refetch(); setIsCreateOpen(false); } });
  const updateMutation = trpc.user.update.useMutation({ onSuccess: () => { refetch(); setEditingUser(null); } });
  const deleteMutation = trpc.user.delete.useMutation({ onSuccess: () => refetch() });
  const { data: departments } = trpc.department.list.useQuery();

  const [form, setForm] = useState({ name: "", email: "", role: "user" as "admin" | "user", departmentId: "" });

  const handleCreate = () => {
    createMutation.mutate({
      name: form.name,
      email: form.email,
      role: form.role,
      departmentId: form.departmentId ? Number(form.departmentId) : undefined,
    });
  };

  const handleUpdate = () => {
    if (!editingUser) return;
    updateMutation.mutate({
      id: editingUser.id,
      name: editingUser.name,
      email: editingUser.email,
      role: editingUser.role,
      departmentId: editingUser.departmentId,
    });
  };

  const roleBadge = (role: string) => {
    if (role === "super_admin") return <Badge variant="destructive">Super Admin</Badge>;
    if (role === "admin") return <Badge>Admin</Badge>;
    return <Badge variant="secondary">Utilisateur</Badge>;
  };

  const canDelete = currentUser?.role === "super_admin";
  const canCreateAdmin = currentUser?.role === "super_admin";

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6" />
              Utilisateurs
            </h1>
            <p className="text-muted-foreground">Gérez les utilisateurs de la plateforme</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvel utilisateur</DialogTitle>
                <DialogDescription>Créez un nouvel utilisateur manuellement</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jean Dupont" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jean@example.com" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select value={form.role} onValueChange={(v: "admin" | "user") => setForm({ ...form, role: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      {canCreateAdmin && <SelectItem value="admin">Administrateur</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Département</Label>
                  <Select value={form.departmentId} onValueChange={v => setForm({ ...form, departmentId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
                      {departments?.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-8"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les rôles</SelectItem>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {currentUser?.role === "super_admin" && <SelectItem value="super_admin">Super Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  )}
                  {data?.items.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name ?? "-"}</TableCell>
                      <TableCell>{u.email ?? "-"}</TableCell>
                      <TableCell>{roleBadge(u.role)}</TableCell>
                      <TableCell>{departments?.find(d => d.id === u.departmentId)?.name ?? "-"}</TableCell>
                      <TableCell>{new Date(u.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Dialog open={editingUser?.id === u.id} onOpenChange={v => !v && setEditingUser(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setEditingUser({ ...u })}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Modifier l'utilisateur</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Nom</Label>
                                  <Input value={editingUser?.name ?? ""} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Email</Label>
                                  <Input value={editingUser?.email ?? ""} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Rôle</Label>
                                  <Select value={editingUser?.role ?? ""} onValueChange={v => setEditingUser({ ...editingUser, role: v })}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">Utilisateur</SelectItem>
                                      {canCreateAdmin && <SelectItem value="admin">Admin</SelectItem>}
                                      {currentUser?.role === "super_admin" && <SelectItem value="super_admin">Super Admin</SelectItem>}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Département</Label>
                                  <Select value={editingUser?.departmentId ? String(editingUser.departmentId) : ""} onValueChange={v => setEditingUser({ ...editingUser, departmentId: v ? Number(v) : null })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionner..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">Aucun</SelectItem>
                                      {departments?.map(d => (
                                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingUser(null)}>Annuler</Button>
                                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>Enregistrer</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          {canDelete && (
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate({ id: u.id })}>
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
