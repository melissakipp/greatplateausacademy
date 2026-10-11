# Maintenance Guide: Great Plateaus Academy Landing Page

*Cultivating Curiosity, Elevating Minds*

The public site for **greatplateausacademy.com**: a landing page that offers a free weekly homeschool printable and a newsletter signup.

- **Stack:** plain HTML, CSS and JavaScript. No framework, no build step.
- **Hosting:** private Amazon S3 bucket served through CloudFront (HTTPS), with DNS in Route 53. The domain is registered at GoDaddy.
- **Newsletter:** Kit (formerly ConvertKit), connected through an inline HTML form.
- **Email:** Proton Mail Essentials on the greatplateausacademy.com domain.
- **Deploys:** GitHub Actions publishes to S3 and clears the CloudFront cache on every push to `main`.

---

## Project structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions deploy to S3 + CloudFront
├── site/                     # everything in here is published
│   ├── index.html            # landing page: printables + newsletter signup
│   ├── thanks.html           # where Kit sends people after they subscribe
│   ├── 404.html              # "page not found" page
│   ├── styles.css
│   ├── main.js               # form validation + small page behaviors
│   ├── downloads/            # free printable PDFs
│   └── images/               # card previews + og.jpg (1200 × 630 social preview)
├── aws/
│   ├── github-trust-policy.json        # lets only this repo's main branch deploy
│   └── github-deploy-permissions.json  # deploy role: upload to one bucket, clear one cache
└── README.md
```

Only the `site/` folder is uploaded. Notes, policies and this README never go live.

---

## Run it locally

No install needed. Open `site/index.html` in a browser, or serve the folder so absolute links like `/styles.css` work:

```bash
cd site
python3 -m http.server 8000
# then visit http://localhost:8000
```

The Kit form submits to Kit's servers, so you can test a real signup from your local copy.

---

## Weekly update: add a new printable

1. **Add the PDF** to `site/downloads/`. Use lowercase letters and dashes, no spaces (for example `chase-curiosity-worksheet.pdf`). S3 is case-sensitive, so the link must match the file name exactly.
2. **Add a preview image** to `site/images/` if the card uses one.
3. **Update `index.html`:**
   - Move the current featured card into the previous-printables row.
   - Put the new printable in the featured card: title, description, `href` to the PDF, the `sr-only` text on the download link, and the `PDF · X pages` line.
   - Move the "New this week" badge to the new card.
4. **Commit and push to `main`.** The site updates in about a minute.
5. **Check it:** open `https://greatplateausacademy.com/downloads/<file-name>.pdf` directly. If it opens, the button works too.

---

## Newsletter (Kit)

The signup form in `index.html` (`<form id="subscribe-form">`) posts to a Kit **inline form**.

- **Form action:** Kit → Grow → Landing Pages & Forms → your inline form → Publish → **HTML**. Copy the `action="..."` URL into the form in `index.html`.
- **Field names:** email uses `name="email_address"`. First name uses `name="fields[first_name]"`, matching Kit's embed code. Delete that input if you stop collecting first names.
- **Kit form settings:**
  - **Incentive email:** on (double opt-in). This email can also carry a download link.
  - **After subscribing:** redirect to `https://greatplateausacademy.com/thanks.html`.
- **Sender:** use your Proton address on greatplateausacademy.com (never a Gmail address), and complete Kit's **Verified Sending Domain** so emails aren't flagged as sent "via" Kit.
- **Test:** subscribe with your own email. You should land on `thanks.html` and get Kit's confirmation email.

> If you add a Content Security Policy header in CloudFront, it must allow Kit's form URL, or the signup will quietly stop working.

---

## Deploying

### How it works
`.github/workflows/deploy.yml` runs on every push to `main` that changes `site/**` (or the workflow itself). You can also run it by hand from the **Actions** tab → **Deploy site to AWS** → **Run workflow**.

It:
1. Signs in to AWS with **OIDC**: short-lived credentials, no AWS keys stored in GitHub.
2. Uploads images, CSS, JS and PDFs with a 1-day browser cache.
3. Uploads HTML with `no-cache`, so visitors see updates right away.
4. Removes files from S3 that were deleted from `site/`.
5. Clears the CloudFront cache (`/*`).

### GitHub repo variables
Settings → Secrets and variables → Actions → **Variables**:

| Variable | Example |
|---|---|
| `AWS_REGION` | `us-west-2` |
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::123456789012:role/gpa-github-deploy` |
| `S3_BUCKET` | `greatplateausacademy-site` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E1ABCDEF2GHIJ` (the cache step is skipped until this is set) |

### One-time AWS setup
1. **OIDC provider:** IAM → Identity providers → Add provider → OpenID Connect
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
2. **Deploy role:** IAM → Roles → Create role → Web identity → the provider above.
   - Trust policy: `aws/github-trust-policy.json`. Replace the AWS wizard's policy entirely (no leftover `StringLike` block).
   - **Gotcha:** GitHub now sends the repo identity with permanent IDs, like `repo:melissakipp@49261904/greatplateausacademy@1413811933:ref:refs/heads/main`. The trust policy lists both this format and the older `repo:owner/repo:ref:refs/heads/main` format. If you see `Not authorized to perform sts:AssumeRoleWithWebIdentity`, compare the `sub` GitHub sends against this policy.
   - Inline policy: `aws/github-deploy-permissions.json` (fill in bucket name, account ID and distribution ID).
3. Add the role ARN to the `AWS_DEPLOY_ROLE_ARN` variable.

### Manual deploy (fallback)
If GitHub Actions is ever unavailable, from the repo root with your admin AWS login:

```bash
aws s3 sync site/ s3://YOUR-BUCKET --delete --exclude ".DS_Store"
aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"
```

---

## Infrastructure reference

| Piece | Setting |
|---|---|
| **S3 bucket** | Block all public access: on. Versioning: on. Read only by CloudFront through Origin Access Control (OAC). |
| **CloudFront** | Redirect HTTP to HTTPS. Default root object `index.html`. Alternate domain names: `greatplateausacademy.com`, `www.greatplateausacademy.com`. Response headers policy with security headers (HSTS and related). |
| **Custom error responses** | `404` → `/404.html`, response code `404`. `403` → `/404.html`, response code `404` (a private bucket reports missing files as 403). |
| **Certificate** | AWS Certificate Manager, created in **us-east-1**, covering the bare domain and `www`. DNS validation. |
| **DNS** | Route 53 hosted zone. GoDaddy nameservers point to Route 53. Alias records for the bare domain and `www` → CloudFront. `www` redirects to the bare domain. |
| **Email** | Proton Mail Essentials: verification TXT, MX, SPF, DKIM and DMARC records in Route 53. Kit Verified Sending Domain records also in Route 53. |
| **Costs** | AWS budget alert at $10/month. Expected cost is a few dollars a month. |

---

## Brand and accessibility

The site targets **WCAG 2.2 AA**. Colors are defined as CSS variables at the top of `styles.css`.

| Color | Hex | Use |
|---|---|---|
| Green | `#5A775F` | Buttons and color bands with white text |
| Green dark | `#3F5342` | Headings, links, focus rings |
| Gold | `#EBBB67` | Backgrounds with dark text only, never as text |
| Gold text | `#8F6213` | Small gold-colored text, like eyebrow labels |
| Turquoise | `#8AD3DA` | Backgrounds and decoration only, never as text |
| Red | `#AD343E` | Error messages on light backgrounds |
| Cream | `#FBF8F2` | Page background |
| Ink | `#2A2622` | Body text |

**Fonts:** Fraunces (headings) and Nunito Sans (body), from Google Fonts.

**Keep in place:** the skip link, visible form labels, error messages tied to their inputs, and `sr-only` text on download links that names the printable.

**Copy notes:** the first printable is called the **Weekly Work Plan**. Use "step" sparingly; prefer plateau language (climb, level, rise, the next level, a wider view).

---

## Launch checklist

- [ ] AWS account secured (root MFA, admin user with MFA, budget alert)
- [ ] Site files tested locally, including a real Kit signup
- [ ] Proton Mail Essentials set up for the domain
- [ ] S3 bucket created; GitHub deploy workflow working
- [ ] Route 53 hosted zone with email records; GoDaddy nameservers switched
- [ ] Proton domain verified; test emails sent both ways
- [ ] SSL certificate issued (us-east-1)
- [ ] CloudFront distribution, error pages and alias records
- [ ] Kit sender set to the Proton address; Verified Sending Domain complete
- [ ] Security headers and www → bare domain redirect
- [ ] Final tests: HTTPS on every address, SSL Labs, security headers, mobile, downloads, 404 page, signup
