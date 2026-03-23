import type { ComponentProps } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonVariant = ComponentProps<typeof Button>["variant"];
type ButtonSize = ComponentProps<typeof Button>["size"];

type ConfirmActionDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
  triggerLabel: string;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  triggerClassName?: string;
  confirmVariant?: ButtonVariant;
  confirmClassName?: string;
  cancelLabel?: string;
  disabled?: boolean;
};

export function ConfirmActionDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  triggerLabel,
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName,
  confirmVariant = "destructive",
  confirmClassName,
  cancelLabel = "Cancel",
  disabled = false,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size={triggerSize}
          variant={triggerVariant}
          className={triggerClassName}
          disabled={disabled}
        >
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline">
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant={confirmVariant}
              className={cn(confirmClassName)}
              onClick={() => void onConfirm()}
            >
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
