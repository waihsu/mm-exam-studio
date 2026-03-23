import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PagePanel } from "@/components/page-container";
import { ADMIN_ROUTES } from "@/constants/routes";

export const Route = createFileRoute("/_protected/users/students")({
  component: StudentsPage,
});

function StudentsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: ADMIN_ROUTES.users, replace: true });
  }, [navigate]);

  return (
    <PagePanel className="bg-white/88 text-sm text-slate-600">
      Redirecting to users...
    </PagePanel>
  );
}
