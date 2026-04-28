import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/AuthLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, User, Mail, Calendar, Building2 } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  const roleLabel = user?.role === "super_admin" ? "Super Administrateur" : user?.role === "admin" ? "Administrateur" : "Utilisateur";
  const roleVariant = user?.role === "super_admin" ? "destructive" : user?.role === "admin" ? "default" : "secondary";

  return (
    <AuthLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
          <p className="text-muted-foreground">Vos informations personnelles</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 border-2">
                <AvatarFallback className="text-2xl font-medium">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-semibold">{user?.name ?? "Utilisateur"}</h2>
                <p className="text-sm text-muted-foreground">{user?.email ?? "-"}</p>
                <Badge variant={roleVariant as any} className="mt-2">{roleLabel}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détails du compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Nom</p>
                <p className="text-sm text-muted-foreground">{user?.name ?? "Non défini"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email ?? "Non défini"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Rôle</p>
                <p className="text-sm text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Dernière connexion</p>
                <p className="text-sm text-muted-foreground">
                  {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">ID utilisateur</p>
                <p className="text-sm text-muted-foreground">{user?.id ?? "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
