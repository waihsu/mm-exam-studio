import type { SignUpCardInput } from "../../../../../shared/src/ui/auth/types";
type GlassSignUpCardProps = {
    brandLabel?: string;
    title?: string;
    description?: string;
    googleLabel?: string;
    submitLabel?: string;
    onSubmit: (input: SignUpCardInput) => Promise<boolean>;
    onGoogleSignIn: () => Promise<void>;
};
export declare function GlassSignUpCard({ brandLabel, title, description, googleLabel, submitLabel, onSubmit, onGoogleSignIn, }: GlassSignUpCardProps): import("react/jsx-runtime").JSX.Element;
export {};
