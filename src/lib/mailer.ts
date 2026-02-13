import { Resend } from "resend"
import { env } from "$env/dynamic/private"
import { env as publicEnv } from "$env/dynamic/public"
import { createClient, type User } from "@supabase/supabase-js"
import type { Database } from "../DatabaseDefinitions"
import welcomeEmailText from "./emails/welcome_email_text.hbs?raw"
import welcomeEmailHtml from "./emails/welcome_email_html.hbs?raw"

const teamInviteText = `You've been invited to join {{{workspaceName}}} on {{{companyName}}}.

Accept invite: {{{inviteLink}}}`

const teamInviteHtml = `<html><body><p>You've been invited to join <strong>{{{workspaceName}}}</strong> on {{{companyName}}}.</p><p><a href="{{{inviteLink}}}">Accept invite</a></p></body></html>`

const EMAIL_TEMPLATES: Record<string, { text?: string; html?: string }> = {
  welcome_email: {
    text: welcomeEmailText,
    html: welcomeEmailHtml,
  },
  team_invite: {
    text: teamInviteText,
    html: teamInviteHtml,
  },
}

type TemplateProps = Record<string, string>

const renderTemplate = (template: string, props: TemplateProps) =>
  template.replace(/\{\{\{?\s*([A-Za-z0-9_]+)\s*\}?\}\}/g, (_match, key) => {
    return props[key] ?? ""
  })

// Sends an email to the admin email address.
// Does not throw errors, but logs them.
export const sendAdminEmail = async ({
  subject,
  body,
}: {
  subject: string
  body: string
}) => {
  // Check admin email is setup
  if (!env.PRIVATE_ADMIN_EMAIL) {
    return
  }

  try {
    const resend = new Resend(env.PRIVATE_RESEND_API_KEY)
    const resp = await resend.emails.send({
      from: env.PRIVATE_FROM_ADMIN_EMAIL || env.PRIVATE_ADMIN_EMAIL,
      to: [env.PRIVATE_ADMIN_EMAIL],
      subject: "ADMIN_MAIL: " + subject,
      text: body,
    })

    if (resp.error) {
      console.log("Failed to send admin email, error:", resp.error)
    }
  } catch (e) {
    console.log("Failed to send admin email, error:", e)
  }
}

export const sendUserEmail = async ({
  user,
  subject,
  from_email,
  template_name,
  template_properties,
}: {
  user: User
  subject: string
  from_email: string
  template_name: string
  template_properties: Record<string, string>
}) => {
  const email = user.email
  if (!email) {
    console.log("No email for user. Aborting email. ", user.id)
    return
  }

  // Check if the user email is verified using the full user object from service role
  // Oauth uses email_verified, and email auth uses email_confirmed_at
  const serverSupabase = createClient<Database>(
    publicEnv.PUBLIC_SUPABASE_URL,
    env.PRIVATE_SUPABASE_SERVICE_ROLE,
    { auth: { persistSession: false } },
  )
  const { data: serviceUserData } = await serverSupabase.auth.admin.getUserById(
    user.id,
  )
  const emailVerified =
    serviceUserData.user?.email_confirmed_at ||
    serviceUserData.user?.user_metadata?.email_verified

  if (!emailVerified) {
    console.log("User email not verified. Aborting email. ", user.id, email)
    return
  }

  // Fetch user profile to check unsubscribed status
  const { data: profile, error: profileError } = await serverSupabase
    .from("profiles")
    .select("unsubscribed")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.log("Error fetching user profile. Aborting email. ", user.id, email)
    return
  }

  if (profile?.unsubscribed) {
    console.log("User unsubscribed. Aborting email. ", user.id, email)
    return
  }

  await sendTemplatedEmail({
    subject,
    to_emails: [email],
    from_email,
    template_name,
    template_properties,
  })
}

export const sendTemplatedEmail = async ({
  subject,
  to_emails,
  from_email,
  template_name,
  template_properties,
}: {
  subject: string
  to_emails: string[]
  from_email: string
  template_name: string
  template_properties: TemplateProps
}) => {
  if (!env.PRIVATE_RESEND_API_KEY) {
    // email not configured.  Emails are optional so no error is thrown
    return
  }

  const template = EMAIL_TEMPLATES[template_name]
  if (!template) {
    console.log("No template found for email:", template_name)
    return
  }

  let plaintextBody: string | undefined = undefined
  if (template.text) {
    plaintextBody = renderTemplate(template.text, template_properties)
  }

  let htmlBody: string | undefined = undefined
  if (template.html) {
    htmlBody = renderTemplate(template.html, template_properties)
  }

  if (!plaintextBody && !htmlBody) {
    console.log(
      "No email body: requires plaintextBody or htmlBody. Template: ",
      template_name,
    )
    return
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const email: any = {
      from: from_email,
      to: to_emails,
      subject: subject,
    }
    if (plaintextBody) {
      email.text = plaintextBody
    }
    if (htmlBody) {
      email.html = htmlBody
    }
    const resend = new Resend(env.PRIVATE_RESEND_API_KEY)
    const resp = await resend.emails.send(email)

    if (resp.error) {
      console.log("Failed to send email, error:", resp.error)
    }
  } catch (e) {
    console.log("Failed to send email, error:", e)
  }
}
