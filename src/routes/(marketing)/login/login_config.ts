import { ThemeSupa } from "@supabase/auth-ui-shared"
import type { Provider } from "@supabase/supabase-js"

export const oauthProviders = ["github"] as Provider[]

// use the css variables from DaisyUI to style Supabase auth template
export const sharedAppearance = {
  theme: ThemeSupa,
  variables: {
    default: {
      colors: {
        brand: "var(--mk-pine)",
        brandAccent: "var(--mk-pine-dark)",
        inputText: "var(--mk-onyx)",
        brandButtonText: "var(--mk-white)",
        messageText: "var(--mk-pine)",
        messageBackground: "var(--mk-panel)",
        messageBorder: "var(--mk-border-strong)",
        dividerBackground: "var(--mk-border)",
        inputLabelText: "var(--mk-onyx-soft)",
        inputBackground: "var(--mk-white)",
        inputBorder: "var(--mk-border-strong)",
        inputBorderHover: "var(--mk-copper)",
        inputBorderFocus: "var(--mk-pine)",
        inputPlaceholder: "var(--mk-olive)",
        defaultButtonBackground: "var(--mk-panel)",
        defaultButtonBackgroundHover: "var(--mk-white)",
        defaultButtonBorder: "var(--mk-border-strong)",
        defaultButtonText: "var(--mk-onyx)",
        anchorTextColor: "var(--mk-copper)",
        anchorTextHoverColor: "var(--mk-pine)",
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
