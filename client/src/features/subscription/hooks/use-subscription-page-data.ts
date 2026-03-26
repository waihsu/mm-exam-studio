import { useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "@/features/workspace/api/workspace-api";
import type { CatalogPlanCode } from "../subscription-catalog";

const WORKSPACE_SUMMARY_QUERY_KEY = ["workspace-summary"] as const;
const SUBSCRIPTION_REQUESTS_QUERY_KEY = ["subscription-requests"] as const;

export function useSubscriptionPageData() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [requestNote, setRequestNote] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [selectedProofName, setSelectedProofName] = useState("");
  const [paymentProofImageDataUrl, setPaymentProofImageDataUrl] = useState("");
  const [selectedPlanCode, setSelectedPlanCode] = useState<CatalogPlanCode>("pro");

  const summaryQuery = useQuery({
    queryKey: WORKSPACE_SUMMARY_QUERY_KEY,
    queryFn: () => workspaceApi.getSummary(),
  });
  const requestsQuery = useQuery({
    queryKey: SUBSCRIPTION_REQUESTS_QUERY_KEY,
    queryFn: () => workspaceApi.listSubscriptionRequests(),
  });

  const requestMutation = useMutation({
    mutationFn: async (planCode: "pro" | "premium") => {
      const response = await workspaceApi.createSubscriptionRequest({
        planCode,
        transactionId: transactionId.trim(),
        paymentProofImageDataUrl: paymentProofImageDataUrl || undefined,
        note: requestNote.trim() || undefined,
      });
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async () => {
      setRequestNote("");
      setTransactionId("");
      setSelectedProofName("");
      setPaymentProofImageDataUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: WORKSPACE_SUMMARY_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_REQUESTS_QUERY_KEY }),
      ]);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await workspaceApi.cancelSubscriptionRequest(requestId);
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: WORKSPACE_SUMMARY_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_REQUESTS_QUERY_KEY }),
      ]);
    },
  });

  const summary = summaryQuery.data?.ok ? summaryQuery.data.data : null;
  const plan = summary?.subscription;
  const requests = requestsQuery.data?.ok ? requestsQuery.data.data.rows : [];
  const latestRequest = requests[0] ?? plan?.latestRequest ?? null;
  const pendingCount = requests.filter((request) => request.status === "pending").length;
  const isPending = latestRequest?.status === "pending";
  const effectiveSelectedPlanCode: Exclude<CatalogPlanCode, "free"> =
    selectedPlanCode === "premium"
      ? "premium"
      : plan?.code === "premium"
        ? "premium"
        : "pro";

  const onPaymentProofFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPaymentProofImageDataUrl("");
      setSelectedProofName("");
      return;
    }

    setSelectedProofName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProofImageDataUrl(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  };

  return {
    fileInputRef,
    requestNote,
    setRequestNote,
    transactionId,
    setTransactionId,
    selectedProofName,
    paymentProofImageDataUrl,
    selectedPlanCode: effectiveSelectedPlanCode,
    setSelectedPlanCode,
    summaryQuery,
    requestsQuery,
    summary,
    plan,
    requests,
    latestRequest,
    pendingCount,
    isPending,
    requestMutation,
    cancelMutation,
    onPaymentProofFileChange,
  };
}
