import { enhance } from "$app/forms"
import type { SubmitFunction } from "@sveltejs/kit"

type SubmitButton = HTMLButtonElement | HTMLInputElement

const buttonState = new WeakMap<
  SubmitButton,
  { disabled: boolean; minWidth: string; html?: string; value?: string }
>()

const hasIconContent = (button: SubmitButton): boolean =>
  button instanceof HTMLButtonElement && button.querySelector("svg") !== null

const pendingSubmit: SubmitFunction = ({ submitter }) => {
  const button =
    submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement
      ? submitter
      : null

  if (button) {
    buttonState.set(button, {
      disabled: button.disabled,
      minWidth: button.style.minWidth,
      html: button instanceof HTMLButtonElement ? button.innerHTML : undefined,
      value: button instanceof HTMLInputElement ? button.value : undefined,
    })
    button.disabled = true
    button.setAttribute("aria-busy", "true")
    button.dataset.pending = "true"

    const pendingLabel = button.dataset.loadingLabel?.trim()
    const canSwapLabel = pendingLabel && !hasIconContent(button)
    if (canSwapLabel) {
      button.style.minWidth = `${button.offsetWidth}px`
      if (button instanceof HTMLButtonElement) {
        button.textContent = pendingLabel
      } else {
        button.value = pendingLabel
      }
    }
  }

  return async () => {
    if (!button) return
    const previous = buttonState.get(button)
    button.removeAttribute("aria-busy")
    delete button.dataset.pending
    button.disabled = previous?.disabled ?? false
    button.style.minWidth = previous?.minWidth ?? ""
    if (button instanceof HTMLButtonElement && typeof previous?.html === "string") {
      button.innerHTML = previous.html
    }
    if (button instanceof HTMLInputElement && typeof previous?.value === "string") {
      button.value = previous.value
    }
    buttonState.delete(button)
  }
}

export const pendingEnhance = (form: HTMLFormElement) =>
  enhance(form, pendingSubmit)
