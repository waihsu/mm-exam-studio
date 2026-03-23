import type { SignInCardInput } from "../../../../../shared/src/ui/auth/types";
type GlassSignInCardProps = {
    brandLabel?: string;
    title?: string;
    description?: string;
    googleLabel?: string;
    submitLabel?: string;
    defaultEmail?: string;
    onSubmit: (input: SignInCardInput) => Promise<boolean>;
    onGoogleSignIn: () => Promise<void>;
};
export declare function GlassSignInCard({ brandLabel, title, description, googleLabel, submitLabel, defaultEmail, onSubmit, onGoogleSignIn, }: GlassSignInCardProps): import("react/jsx-runtime").JSX.Element;
export {};
