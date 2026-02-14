- [x] fix Flag to follow button/modal pattern
- [x] fix flag page so it doesn't have a flag sidebar (can't flag flags?)
- [x] light green outline for empty flag sidebars with just a thumbs-up outline icon
- [ ] flags dashboard: center main body + filterable grid of flags
- [ ] Claude IA convo solutioning
- [x] Screen Check (`plans/SR-16_SCREEN_ROUTE_AUDIT.md`)
Based on your project's file structure, here is the complete checklist of every screen (route) in your application.

I have grouped them by their logical section (Marketing, App, Account) to make this list easier to review.

### **Marketing & Public Pages**

* [ ] **Home** (`/`)
* [ ] **Method** (`/method`)
* [ ] **Method Detail** (`/method/[slug]`)
* [ ] **Partners** (`/partners`)
* [ ] **Pricing** (`/pricing`)
* [ ] **Contact** (`/contact` & `/contact_us`)
* [ ] **Search** (`/search`)
* [ ] **Invite Acceptance** (`/invite/[token]`)
* [ ] **Ownership Transfer** (`/transfer/[token]`)

### **Blog**

* [ ] **Blog Index** (`/blog`)
* [ ] **Blog Post: Awesome Post** (`/blog/awesome_post`)
* [ ] **Blog Post: Example** (`/blog/example_blog_post`)
* [ ] **Blog Post: 41kb SaaS Story** (`/blog/how_we_built_our_41kb_saas_website`)

### **Authentication**

* [ ] **Login Root** (`/login`)
* [ ] **Sign In** (`/login/sign_in`)
* [ ] **Sign Up** (`/login/sign_up`)
* [ ] **Forgot Password** (`/login/forgot_password`)
* [ ] **Password Error** (`/login/current_password_error`)

### **App (Workspace)**

* [ ] **Workspace Dashboard** (`/app/workspace`)
* [ ] **Team / Members** (`/app/team`)
* [ ] **Systems Index** (`/app/systems`)
* [ ] **System Detail** (`/app/systems/[slug]`)
* [ ] **Processes Index** (`/app/processes`)
* [ ] **Process Detail** (`/app/processes/[slug]`)
* [ ] **Roles Index** (`/app/roles`)
* [ ] **Role Detail** (`/app/roles/[slug]`)
* [ ] **Flags (Issues)** (`/app/flags`)

### **Account & Settings**

* [ ] **Account Home** (`/account`)
* [ ] **Create Profile** (`/account/create_profile`)
* [ ] **Select Plan** (`/account/select_plan`)
* [ ] **Billing** (`/account/billing`)
* [ ] **Settings** (`/account/settings`)
* [ ] **Edit Profile** (`/account/settings/edit_profile`)
* [ ] **Change Email** (`/account/settings/change_email`)
* [ ] **Email Subscriptions** (`/account/settings/change_email_subscription`)
* [ ] **Change Password** (`/account/settings/change_password`)
* [ ] **Reset Password** (`/account/settings/reset_password`)
* [ ] **Delete Account** (`/account/settings/delete_account`)
* [ ] **Sign Out** (`/account/sign_out`)

### **System**

* [ ] **Global Error Page** (`+error.svelte`)
