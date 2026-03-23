"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mail, ShieldCheck } from "lucide-react";

export type UitripledProfilePageProps = {
  userEmail: string;
  displayName: string;
  supportEmail: string;
  currentUserRoles?: string[];
  displayNameError?: string | null;
  supportEmailError?: string | null;
  isLoading: boolean;
  isSaving: boolean;
  canSave?: boolean;
  onDisplayNameChange: (value: string) => void;
  onSupportEmailChange: (value: string) => void;
  onBack?: () => void;
  onSave: () => Promise<void> | void;
  showBackButton?: boolean;
};

const getInitials = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return "AD";
  const parts = normalized.split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
};

export function UitripledProfilePage({
  userEmail,
  displayName,
  supportEmail,
  currentUserRoles = [],
  displayNameError,
  supportEmailError,
  isLoading,
  isSaving,
  canSave = true,
  onDisplayNameChange,
  onSupportEmailChange,
  onBack,
  onSave,
  showBackButton = true,
}: UitripledProfilePageProps) {
  const initials = getInitials(displayName || "Admin");

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-300/70 bg-white/90 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.45)]">
      <div
        className="relative h-48 w-full overflow-hidden md:h-52"
        role="img"
        aria-label="Profile cover background"
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "linear-gradient(45deg, #0f172a 0%, #0f766e 100%)",
              "linear-gradient(45deg, #164e63 0%, #0369a1 100%)",
              "linear-gradient(45deg, #0f172a 0%, #1d4ed8 100%)",
              "linear-gradient(45deg, #0f172a 0%, #0e7490 100%)",
              "linear-gradient(45deg, #0f172a 0%, #0f766e 100%)",
            ],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div className="mx-auto w-full max-w-[1320px] px-4 pb-7 sm:px-6 md:px-8">
        <div className="relative -mt-10 mb-6 flex flex-col gap-4 sm:-mt-12 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="relative"
            >
              <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl sm:h-24 sm:w-24">
                <Avatar className="h-full w-full">
                  <AvatarImage alt={`${displayName || "Admin"} avatar`} />
                  <AvatarFallback className="bg-slate-950 text-xl text-white sm:text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div
                className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500"
                aria-label="Profile active"
                role="status"
              />
            </motion.div>

            <div className="space-y-1">
              <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
                {displayName || "Admin User"}
              </h1>
              <p className="text-sm text-slate-600">{userEmail || "unknown email"}</p>
              {currentUserRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentUserRoles.map((role) => (
                    <Badge key={role} variant="outline">
                      {role}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex gap-2 md:mb-1">
            {showBackButton ? (
              <Button
                variant="outline"
                className="border-slate-300 bg-white/85"
                onClick={onBack}
                disabled={isSaving}
              >
                Back
              </Button>
            ) : null}
            <Button
              className="bg-slate-900 text-white hover:bg-slate-800"
              onClick={onSave}
              disabled={isLoading || isSaving || !canSave}
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-300/80 bg-gradient-to-b from-slate-900 via-slate-800 to-cyan-900 p-5 text-white shadow-inner">
            <div className="flex items-center gap-2 text-cyan-100">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.18em]">Admin Profile</p>
            </div>
            <p className="mt-4 text-sm text-cyan-50/95">
              This profile appears on admin header and settings pages.
            </p>
            <div className="mt-4 rounded-xl border border-white/20 bg-white/10 p-3 text-xs text-cyan-50/90">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{supportEmail || "support@example.com"}</span>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-white/20 bg-white/10 p-3 text-xs text-cyan-50/90">
              <p className="font-semibold text-white">Profile impact</p>
              <p className="mt-1 leading-relaxed">
                Changes here affect admin identity labels and the support contact
                shown across operations workflows.
              </p>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-300 bg-white p-5 md:p-6">
            <h2 className="text-2xl font-black text-slate-900">Profile Settings</h2>
            <p className="mt-1 text-sm text-slate-600">
              Keep your admin identity and support contact consistent.
            </p>

            <div className="mt-5 grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">Display Name</span>
                <input
                  value={displayName}
                  onChange={(e) => onDisplayNameChange(e.target.value)}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3"
                  placeholder="Study Admin Team"
                  disabled={isLoading || isSaving}
                />
                {displayNameError ? (
                  <span className="text-xs text-rose-600">{displayNameError}</span>
                ) : (
                  <span className="text-xs text-slate-500">
                    This label appears in admin header and settings surfaces.
                  </span>
                )}
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">Support Email</span>
                <input
                  value={supportEmail}
                  onChange={(e) => onSupportEmailChange(e.target.value)}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3"
                  placeholder="support@example.com"
                  disabled={isLoading || isSaving}
                />
                {supportEmailError ? (
                  <span className="text-xs text-rose-600">{supportEmailError}</span>
                ) : (
                  <span className="text-xs text-slate-500">
                    Used as the default admin support contact for operations handoff.
                  </span>
                )}
              </label>
            </div>
            </div>

            <div className="rounded-2xl border border-slate-300 bg-slate-50/70 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Save checklist
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-900">Display consistency</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Keep the admin name stable so audit and support ownership stay easy
                    to recognize.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-900">Support ownership</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Use a monitored mailbox so outbound support references do not
                    point to a stale inbox.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Backward-compatible export for old imports.
export { UitripledProfilePage as ProfilePage };
