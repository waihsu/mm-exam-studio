import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Shield, Users } from "lucide-react";

type GlassProfileSettingsCardProps = {
  name: string;
  email: string;
  userId: string;
  accessLabel: string;
  roles: string[];
  activeSessions: number;
  otherDevices: number;
  sessionStatus: "live" | "error" | "loading";
  securityPath: string;
  usersPath: string;
  onVerifyProtectedApi: () => void;
  verifyMessage?: string | null;
};

const toInitials = (input: string) => {
  const parts = input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "AD";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
};

export function GlassProfileSettingsCard({
  name,
  email,
  userId,
  accessLabel,
  roles,
  activeSessions,
  otherDevices,
  sessionStatus,
  securityPath,
  usersPath,
  onVerifyProtectedApi,
  verifyMessage,
}: GlassProfileSettingsCardProps) {
  return (
    <section className="group w-full rounded-3xl border border-border/60 bg-card/85 p-8 backdrop-blur-xl sm:p-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Profile
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
            Admin identity and access
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep account metadata and operational session signals in one place.
          </p>
        </div>
        <Badge className="rounded-full border border-border/60 bg-white/5 px-4 py-2 text-muted-foreground">
          {accessLabel}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-border/60">
              <AvatarImage src="" alt={name} />
              <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                {toInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">User id</dt>
              <dd className="mt-1 break-all font-medium text-foreground">{userId}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Roles</dt>
              <dd className="mt-1 font-medium text-foreground">{roles.join(", ") || "none"}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoMiniCard label="Session status" value={sessionStatus} />
            <InfoMiniCard label="Active sessions" value={String(activeSessions)} />
            <InfoMiniCard label="Other devices" value={String(otherDevices)} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" className="justify-start rounded-2xl border-border/60 bg-white/5 px-4 py-6">
              <Link to={securityPath}>
                <Shield className="mr-2 h-4 w-4" />
                Open security sessions
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-2xl border-border/60 bg-white/5 px-4 py-6">
              <Link to={usersPath}>
                <Users className="mr-2 h-4 w-4" />
                Open user management
              </Link>
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-center rounded-2xl border-border/60 bg-white/5"
            onClick={onVerifyProtectedApi}
          >
            <Mail className="mr-2 h-4 w-4" />
            Verify protected API
          </Button>

          {verifyMessage ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {verifyMessage}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function InfoMiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize text-foreground">{value}</p>
    </div>
  );
}
