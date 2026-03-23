import { Button } from "@/components/ui/button";

type GoogleSignInButtonProps = {
  onClick: () => Promise<void>;
  label: string;
};

export function GoogleSignInButton({ onClick, label }: GoogleSignInButtonProps) {
  return (
    <Button type="button" variant="outline" className="w-full" onClick={onClick}>
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-emerald-500 to-yellow-400 text-xs font-bold text-white">
        G
      </span>
      {label}
    </Button>
  );
}
