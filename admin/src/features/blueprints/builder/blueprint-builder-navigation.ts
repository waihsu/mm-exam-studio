import { blueprintWizardSteps, type BlueprintWizardStep } from "./blueprint-builder.model";

export type BlueprintNavigationIssue =
  | "setup-incomplete"
  | "difficulty-invalid"
  | "structure-incomplete";

type BlueprintNavigationState = {
  activeStep: BlueprintWizardStep;
  stepAvailability: Record<BlueprintWizardStep, boolean>;
  setupStepReady: boolean;
  hasValidDifficulty: boolean;
  structureStepReady: boolean;
};

export function getBlueprintNextStep({
  activeStep,
  setupStepReady,
  hasValidDifficulty,
  structureStepReady,
}: Omit<BlueprintNavigationState, "stepAvailability">): {
  nextStep?: BlueprintWizardStep;
  issue?: BlueprintNavigationIssue;
} {
  if (activeStep === "setup" && !setupStepReady) return { issue: "setup-incomplete" };
  if (activeStep === "filters" && !hasValidDifficulty) return { issue: "difficulty-invalid" };
  if (activeStep === "structure" && !structureStepReady) return { issue: "structure-incomplete" };
  const currentStepIndex = blueprintWizardSteps.findIndex((step) => step.key === activeStep);
  return { nextStep: blueprintWizardSteps[currentStepIndex + 1]?.key };
}

export const blueprintNavigationIssueMessage: Record<BlueprintNavigationIssue, string> = {
  "setup-incomplete": "Complete title, grade, subject, and total marks first.",
  "difficulty-invalid": "Difficulty distribution must total 100% and keep hard + advance at 30% or less.",
  "structure-incomplete": "Complete the required section or slot structure before review.",
};

export function canNavigateToBlueprintStep(
  step: BlueprintWizardStep,
  stepAvailability: BlueprintNavigationState["stepAvailability"],
) {
  return stepAvailability[step];
}
