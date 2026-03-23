import { Button } from "@/components/ui/button";

type SessionCardProps = {
  isPending: boolean;
  email: string | null;
  onSignOut: () => Promise<void>;
  onRevokeOtherSessions: () => Promise<void>;
};

export function SessionCard({
  isPending,
  email,
  onSignOut,
  onRevokeOtherSessions,
}: SessionCardProps) {
  return (
    <div className="w-full rounded-md border p-4 space-y-2">
      <p className="font-semibold">Session</p>
      {isPending ? <p>Checking session...</p> : null}
      {email ? (
        <div className="space-y-2">
          <p>Signed in as: {email}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onRevokeOtherSessions}>
              Keep This Device Only
            </Button>
            <Button onClick={onSignOut}>Sign out</Button>
          </div>
        </div>
      ) : (
        <p>No active session</p>
      )}
    </div>
  );
}
