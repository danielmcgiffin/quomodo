import { ThemeSupa } from "@supabase/auth-ui-shared"
import type { Provider } from "@supabase/supabase-js"

export const oauthProviders = ["github"] as Provider[]

// use the css variables from DaisyUI to style Supabase auth template
export const sharedAppearance = {
  theme: ThemeSupa,
  variables: {
    default: {
      colors: {
        brand: "var(--mk-gold)",
        brandAccent: "var(--mk-gold-muted)",
        inputText: "var(--mk-text)",
        brandButtonText: "var(--mk-bg)",
        messageText: "var(--mk-gold-text)",
        messageBackground: "var(--mk-bg-card)",
        messageBorder: "var(--mk-border)",
        dividerBackground: "var(--mk-border)",
        inputLabelText: "var(--mk-text-secondary)",
        inputBackground: "var(--mk-bg-card-soft)",
        inputBorder: "var(--mk-border)",
        inputBorderHover: "var(--mk-gold-muted)",
        inputBorderFocus: "var(--mk-gold)",
        inputPlaceholder: "var(--mk-text-secondary)",
        defaultButtonBackground: "var(--mk-bg-card)",
        defaultButtonBackgroundHover: "var(--mk-bg-card-soft)",
        defaultButtonBorder: "var(--mk-border)",
        defaultButtonText: "var(--mk-text)",
        anchorTextColor: "var(--mk-gold-text)",
        anchorTextHoverColor: "var(--mk-gold)",
      },
      fontSizes: {
        baseInputSize: "16px",
      },
    },
  },
  className: {
    button: "authBtn",
  },
}
