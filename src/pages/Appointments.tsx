import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Trash2, Pencil, CalendarDays, MapPin, Users, CheckCircle2, XCircle } from "lucide-react";

export default function AppointmentsPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", location: "", startDate: "", startTime: "", endDate: "", endTime: "", participantIds: [] as string[] });

  const { data, isLoading, refetch } = trpc.appointment.list.useQuery({ search: search || undefined });
  const { data: allUsers } = trpc.user.listAll.useQuery();
  const createMutation = trpc.appointment.create.useMutation({ onSuccess: () => { refetch(); setIsCreateOpen(false); resetForm(); } });
  const updateMutation = trpc.appointment.update.useMutation({ onSuccess: () => { refetch(); setEditingAppt(null); } });
  const deleteMutation = trpc.appointment.delete.useMutation({ onSuccess: () => refetch() });
  const respondMutation = trpc.appointment.respondToInvitation.useMutation({ onSuccess: () => refetch() });

  const canManage = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  function resetForm() {
    setForm({ title: "", description: "", location: "", startDate: "", startTime: "", endDate: "", endTime: "", participantIds: [] });
  }

  function buildDate(dateStr: string, timeStr: string) {
    if (!dateStr || !timeStr) return undefined;
    return new Date(`${dateStr}T${timeStr}`);
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarDays className="h-6 w-6" />
              Rendez-vous
            </h1>
            <p className="text-muted-foreground">Planifiez et gérez les rendez-vous</p>
          </div>
          {canManage && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />Nouveau RDV</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nouveau rendez-vous</DialogTitle>
                  <DialogDescription>Planifiez un rendez-vous avec les participants</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Titre</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Réunion hebdomadaire" /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ordre du jour..." /></div>
                  <div className="space-y-2"><Label>Lieu</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Salle A, Visio..." /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Date début</Label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Heure début</Label><Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Date fin</Label><Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Heure fin</Label><Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Participants</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                      {allUsers?.map(u => (
                        <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.participantIds.includes(String(u.id))}
                            onChange={e => {
                              if (e.target.checked) setForm({ ...form, participantIds: [...form.participantIds, String(u.id)] });
                              else setForm({ ...form, participantIds: form.participantIds.filter(id => id !== String(u.id)) });
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{u.name ?? u.email ?? `Utilisateur ${u.id}`}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                  <Button onClick={() => {
                    const startTime = buildDate(form.startDate, form.startTime);
                    const endTime = buildDate(form.endDate, form.endTime);
                    if (!startTime || !endTime) return;
                    createMutation.mutate({ title: form.title, description: form.description, location: form.location, startTime, endTime, participantIds: form.participantIds.map(Number) });
                  }} disabled={createMutation.isPending || !form.title.trim() || !form.startDate || !form.startTime || !form.endDate || !form.endTime}>Créer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Date & Heure</TableHead>
                    <TableHead>Lieu</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead className="w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucun rendez-vous</TableCell></TableRow>
                  )}
                  {data?.items.map(appt => {
                    const start = new Date(appt.startTime);
                    const end = new Date(appt.endTime);
                    return (
                      <TableRow key={appt.id}>
                        <TableCell className="font-medium">{appt.title}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{start.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                            <span className="text-xs text-muted-foreground">{start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} - {end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </TableCell>
                        <TableCell>{appt.location ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{appt.location}</span> : "-"}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-1"><Users className="h-3 w-3" />Voir</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Participants</DialogTitle></DialogHeader>
                              <div className="space-y-2 py-4">
                                {/* Participants list would need to be fetched per appointment - simplified here */}
                                <p className="text-sm text-muted-foreground">Les invitations ont été envoyées aux participants sélectionnés.</p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!canManage && (
                              <>
                                <Button variant="ghost" size="icon" className="text-emerald-600" onClick={() => respondMutation.mutate({ appointmentId: appt.id, status: "accepted" })}>
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => respondMutation.mutate({ appointmentId: appt.id, status: "declined" })}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {canManage && (
                              <>
                                <Dialog open={editingAppt?.id === appt.id} onOpenChange={v => !v && setEditingAppt(null)}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setEditingAppt({ ...appt })}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-lg">
                                    <DialogHeader><DialogTitle>Modifier le rendez-vous</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="space-y-2"><Label>Titre</Label><Input value={editingAppt?.title ?? ""} onChange={e => setEditingAppt({ ...editingAppt, title: e.target.value })} /></div>
                                      <div className="space-y-2"><Label>Description</Label><Textarea value={editingAppt?.description ?? ""} onChange={e => setEditingAppt({ ...editingAppt, description: e.target.value })} /></div>
                                      <div className="space-y-2"><Label>Lieu</Label><Input value={editingAppt?.location ?? ""} onChange={e => setEditingAppt({ ...editingAppt, location: e.target.value })} /></div>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setEditingAppt(null)}>Annuler</Button>
                                      <Button onClick={() => updateMutation.mutate({ id: editingAppt.id, title: editingAppt.title, description: editingAppt.description, location: editingAppt.location })} disabled={updateMutation.isPending}>Enregistrer</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate({ id: appt.id })}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
