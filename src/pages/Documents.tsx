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
import { Switch } from "@/components/ui/switch";
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
import { Plus, Search, Trash2, Pencil, FileText, ExternalLink, Lock, Globe } from "lucide-react";

export default function DocumentsPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [form, setForm] = useState({ title: "", content: "", fileUrl: "", category: "", isPublic: false });

  const { data, isLoading, refetch } = trpc.document.list.useQuery({ search: search || undefined, category: categoryFilter || undefined });
  const createMutation = trpc.document.create.useMutation({ onSuccess: () => { refetch(); setIsCreateOpen(false); setForm({ title: "", content: "", fileUrl: "", category: "", isPublic: false }); } });
  const updateMutation = trpc.document.update.useMutation({ onSuccess: () => { refetch(); setEditingDoc(null); } });
  const deleteMutation = trpc.document.delete.useMutation({ onSuccess: () => refetch() });

  const canManage = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  const categories = ["Rapport", "Note", "Procédure", "Contrat", "Autre"];

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Documents
            </h1>
            <p className="text-muted-foreground">Gérez les documents et fichiers partagés</p>
          </div>
          {canManage && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />Ajouter</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nouveau document</DialogTitle>
                  <DialogDescription>Ajoutez un document ou une note</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Titre</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titre du document" /></div>
                  <div className="space-y-2"><Label>Contenu / Notes</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Contenu textuel..." /></div>
                  <div className="space-y-2"><Label>Lien fichier (URL)</Label><Input value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." /></div>
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucune</SelectItem>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.isPublic} onCheckedChange={v => setForm({ ...form, isPublic: v })} />
                    <Label>Document public (accessible à tous)</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                  <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.title.trim()}>Créer</Button>
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Toutes les catégories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Visibilité</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucun document</TableCell></TableRow>
                  )}
                  {data?.items.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>{doc.category ? <Badge variant="outline">{doc.category}</Badge> : "-"}</TableCell>
                      <TableCell>{doc.isPublic ? <span className="flex items-center gap-1 text-xs text-emerald-600"><Globe className="h-3 w-3" />Public</span> : <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Privé</span>}</TableCell>
                      <TableCell>{new Date(doc.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {doc.fileUrl && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                            </Button>
                          )}
                          {canManage && (
                            <>
                              <Dialog open={editingDoc?.id === doc.id} onOpenChange={v => !v && setEditingDoc(null)}>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => setEditingDoc({ ...doc })}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                  <DialogHeader><DialogTitle>Modifier le document</DialogTitle></DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2"><Label>Titre</Label><Input value={editingDoc?.title ?? ""} onChange={e => setEditingDoc({ ...editingDoc, title: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Contenu</Label><Textarea value={editingDoc?.content ?? ""} onChange={e => setEditingDoc({ ...editingDoc, content: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Lien</Label><Input value={editingDoc?.fileUrl ?? ""} onChange={e => setEditingDoc({ ...editingDoc, fileUrl: e.target.value })} /></div>
                                    <div className="flex items-center gap-2">
                                      <Switch checked={editingDoc?.isPublic ?? false} onCheckedChange={v => setEditingDoc({ ...editingDoc, isPublic: v })} />
                                      <Label>Public</Label>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditingDoc(null)}>Annuler</Button>
                                    <Button onClick={() => updateMutation.mutate({ id: editingDoc.id, title: editingDoc.title, content: editingDoc.content, fileUrl: editingDoc.fileUrl, isPublic: editingDoc.isPublic })} disabled={updateMutation.isPending}>Enregistrer</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate({ id: doc.id })}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
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
