import { Laptop, LoaderCircle, MonitorSmartphone, ShieldX, Smartphone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  AdminUserDeviceListResult,
  AdminUserDeviceRow,
  AdminUserDirectoryRow,
} from "../types";

type UserDevicesDialogProps = {
  user: AdminUserDirectoryRow["user"] | null;
  loading: boolean;
  error: Error | null;
  devices: AdminUserDeviceListResult | null | undefined;
  revokingDeviceId?: string;
  onOpenChange: (open: boolean) => void;
  onRevoke: (deviceId: string) => void;
};

export function UserDevicesDialog({
  user,
  loading,
  error,
  devices,
  revokingDeviceId,
  onOpenChange,
  onRevoke,
}: UserDevicesDialogProps) {
  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <MonitorSmartphone className="h-5 w-5 text-slate-600" />
            Manage devices
          </DialogTitle>
          <DialogDescription className="space-y-1 text-slate-600">
            <span className="block font-medium text-slate-800">{user?.name ?? "User"}</span>
            <span className="block">{user?.email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[68vh] space-y-4 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading active devices...
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Could not load devices</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ) : devices ? (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Active devices {devices.activeDeviceCount} / {devices.deviceLimit}
              </div>
              {devices.devices.length ? (
                <div className="space-y-3">
                  {devices.devices.map((device) => (
                    <DeviceRow
                      key={device.id}
                      device={device}
                      revoking={revokingDeviceId === device.id}
                      canRevoke={Boolean(user)}
                      onRevoke={() => onRevoke(device.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No active device records found.</p>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeviceRow({
  device,
  revoking,
  canRevoke,
  onRevoke,
}: {
  device: AdminUserDeviceRow;
  revoking: boolean;
  canRevoke: boolean;
  onRevoke: () => void;
}) {
  const DeviceIcon = deviceTypeIcon(device.deviceType);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={deviceTypeTone[device.deviceType]}>
              <DeviceIcon className="mr-1 h-3.5 w-3.5" />
              {device.deviceType}
            </Badge>
            <span className="text-sm font-medium text-slate-900">
              {device.deviceLabel ?? "Unnamed device"}
            </span>
          </div>
          <p className="text-xs text-slate-500">Last seen {formatLastSeenAt(device.lastSeenAt)}</p>
          {device.userAgent ? (
            <p className="break-all text-xs text-slate-400">{device.userAgent}</p>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50"
          disabled={revoking || !canRevoke}
          onClick={onRevoke}
        >
          {revoking ? (
            <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShieldX className="mr-1 h-3.5 w-3.5" />
          )}
          Revoke
        </Button>
      </div>
    </div>
  );
}

const deviceTypeTone: Record<AdminUserDeviceRow["deviceType"], string> = {
  mobile: "border-blue-200 bg-blue-50 text-blue-700",
  desktop: "border-violet-200 bg-violet-50 text-violet-700",
  unknown: "border-slate-200 bg-slate-100 text-slate-700",
};

function deviceTypeIcon(type: AdminUserDeviceRow["deviceType"]) {
  if (type === "mobile") return Smartphone;
  if (type === "desktop") return Laptop;
  return MonitorSmartphone;
}

function formatLastSeenAt(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Unknown activity";
}
