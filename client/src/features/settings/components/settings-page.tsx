import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  ImagePlus,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeader, SectionCard, StatGrid } from "@/components/ui/page-shell";
import { userAppRoutes } from "@/constants/routes";
import { useSettingsPageData } from "../hooks/use-settings-page-data";
import { ChecklistRow, InfoCard } from "./settings-shared";

export function SettingsPage() {
  const {
    auth,
    user,
    fileInputRef,
    label,
    setLabel,
    selectedFileName,
    imageDataUrl,
    summary,
    brandAssets,
    brandingLimit,
    remainingBrandSlots,
    isEmailVerified,
    accountStatus,
    accountStatusChangedAt,
    canUpload,
    createMutation,
    primaryMutation,
    deleteMutation,
    onLogoFileChange,
  } = useSettingsPageData();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Workspace settings"
        title="Account and branding"
        description="Manage account status and paper logos."
        chips={
          <>
            <span className="app-chip">Open access</span>
            <span className="app-chip">{summary?.brandingCount ?? 0}/{brandingLimit || 0} saved</span>
            <span className="app-chip">{accountStatus}</span>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline" className="bg-[#fffdf8]">
              <Link to={userAppRoutes.profile}>
                <UserRound className="h-4 w-4" />
                Open profile
              </Link>
            </Button>
          </>
        }
      />

      <StatGrid>
        <InfoCard
          label="Email verification"
          value={isEmailVerified ? "Verified" : "Not verified"}
          note={
            isEmailVerified
              ? "Sign in recovery and security checks are healthier."
              : "Verify email to reduce account-recovery friction."
          }
        />
        <InfoCard
          label="Account status"
          value={accountStatus}
          note={
            accountStatusChangedAt
              ? `Last status update on ${accountStatusChangedAt}`
              : "No recent status changes."
          }
        />
        <InfoCard
          label="Session expires"
          value={
            auth?.session?.expiresAt
              ? new Date(auth.session.expiresAt).toLocaleString("en-US")
              : "Unknown"
          }
          note={user?.name ? `Signed in as ${user.name}` : "Session metadata unavailable."}
        />
        <InfoCard
          label="Branding access"
          value="Open access"
          note={
            brandingLimit > 0
              ? `${remainingBrandSlots} slot(s) left out of ${brandingLimit}`
              : "No saved logo slots are currently available."
          }
        />
      </StatGrid>

      <SectionCard
        title="Open access"
        description="All core study and paper tools are available without a subscription."
      >
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            label="Practice"
            value="No session cap"
            note="Create practice sessions freely"
          />
          <InfoCard
            label="Papers"
            value="No paper cap"
            note="Generate and edit papers freely"
          />
          <InfoCard
            label="Exports"
            value="No monthly cap"
            note="Export PDFs when you need them"
          />
          <InfoCard
            label="Devices"
            value={`Up to ${summary?.subscription.limits.deviceLimit ?? 25}`}
            note="Operational device safety limit"
          />
        </div>
      </SectionCard>

      <section className="stagger-children grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <SectionCard
          title="Quick actions"
          description="Go to common tasks."
        >
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" className="justify-between bg-[#fffdf8]">
              <Link to={userAppRoutes.profile}>
                Profile and devices
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between bg-[#fffdf8]">
              <Link to={userAppRoutes.support}>
                Support chat
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between bg-[#fffdf8]">
              <Link to={userAppRoutes.practice}>
                Practice builder
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between bg-[#fffdf8]">
              <Link to="/question-papers/new">
                New paper draft
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </SectionCard>
        <SectionCard title="Checklist">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#48766b]" />
          </div>
          <div className="mt-4 space-y-2">
            <ChecklistRow
              label="Signed-in account detected"
              ok={Boolean(user?.email)}
            />
            <ChecklistRow label="Email verification" ok={isEmailVerified} />
            <ChecklistRow label="Branding available in open access" ok={brandingLimit > 0} />
            <ChecklistRow label="At least one logo saved" ok={brandAssets.length > 0} />
          </div>
          <p className="mt-3 text-xs text-[#6e706b]">Keep these ready before printing papers.</p>
        </SectionCard>
      </section>

      <section className="stagger-children grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-xl border border-[#d8d4c9] bg-[#fffdf8] p-4">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-[#202321]" />
            <h3 className="text-base font-semibold text-[#202321]">Upload logo</h3>
          </div>
          <div className="mt-4 space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6e706b]">
                Label
              </span>
              <input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="School logo, Personal mark, Main header"
                className="h-11 w-full rounded-xl border border-[#d8d4c9] bg-[#fffdf8] px-3 text-sm outline-none transition focus:border-[#48766b]"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6e706b]">
                Image file
              </span>
              <div className="rounded-lg border border-dashed border-[#d8d4c9] bg-[#f8f5ee] px-3 py-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={onLogoFileChange}
                  className="block w-full text-sm text-[#202321] file:mr-3 file:rounded-lg file:border-0 file:bg-[#202321] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </div>
            </label>
            {selectedFileName ? (
              <p className="rounded-lg border border-[#d8d4c9] bg-[#f8f5ee] px-3 py-2 text-sm text-[#6e706b]">
                Selected: {selectedFileName}
              </p>
            ) : (
              <p className="text-sm text-[#6e706b]">
                PNG, JPG, WEBP, or SVG. Keep the mark simple for cleaner PDF headers.
              </p>
            )}
            {imageDataUrl ? (
              <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg border border-[#d8d4c9] bg-[#f8f5ee]">
                <img
                  src={imageDataUrl}
                  alt="Logo preview"
                  className="max-h-20 max-w-[80%] object-contain"
                />
              </div>
            ) : null}
            {createMutation.data && !createMutation.data.ok ? (
              <Notice tone="error">
                {createMutation.data.message}
              </Notice>
            ) : null}
            <Button
              className="w-full"
              disabled={!canUpload}
              onClick={() => {
                void createMutation.mutateAsync();
              }}
            >
              {createMutation.isPending ? "Uploading..." : "Save logo"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-[#d8d4c9] bg-[#fffdf8] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#202321]">Saved branding</h3>
              <p className="mt-1 text-sm text-[#6e706b]">Pick one as primary logo.</p>
            </div>
            <span className="rounded-full bg-[#e7efe9] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#6e706b]">
              {brandAssets.length} saved
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {brandAssets.length === 0 ? (
              <EmptyState
                title="No logos saved yet"
                description="Upload one to start branding question papers."
                icon={FolderOpen}
                className="lg:col-span-2"
              />
            ) : null}

            {brandAssets.map((asset) => (
              <div
                key={asset.id}
                className={`rounded-lg border p-3 ${
                  asset.isPrimary
                    ? "border-[#c9dcd3] bg-[#e7efe9]"
                    : "border-[#d8d4c9] bg-[#f8f5ee]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#202321]">{asset.label}</p>
                    <p className="mt-1 text-xs text-[#6e706b]">
                      Added {new Date(asset.createdAt).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  {asset.isPrimary ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#48766b]">
                      Primary
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex h-28 items-center justify-center overflow-hidden rounded-lg border border-[#d8d4c9] bg-[#fffdf8]">
                  <img
                    src={asset.imageDataUrl}
                    alt={asset.label}
                    className="max-h-16 max-w-[80%] object-contain"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!asset.isPrimary ? (
                    <Button
                      variant="outline"
                      className="bg-[#fffdf8]"
                      disabled={primaryMutation.isPending}
                      onClick={() => {
                        void primaryMutation.mutateAsync(asset.id);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Make primary
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className="bg-[#fffdf8] text-red-600 hover:text-red-700"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (!window.confirm(`Delete "${asset.label}"?`)) return;
                      void deleteMutation.mutateAsync(asset.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
