# Great Plateaus Academy — Website (Oct 2026)

Plain HTML, CSS and JS. No build step.

```
index.html      home page (this week's printable, coming up, about, newsletter)
thanks.html     where Kit sends people after they sign up
404.html        shown for any address that doesn't exist
styles.css      all styles (brand colors at the top)
main.js         form checks + footer year
downloads/      the PDFs
images/         printable previews + og.jpg (1200x630 social preview)
```

Links to `styles.css` and `main.js` start with `/`, so every page finds them
at any address. Open the site through your domain (or a local server), not by
double-clicking the file.

## Each Wednesday

1. Upload the new PDF to `downloads/` and its preview image to `images/`
   (lowercase-with-dashes names, no spaces).
2. In `index.html`, copy this week's printable into the **Past printables**
   list (remove the comment markers around that section the first time).
3. Update the featured card: image, alt text, title, description, download link.
4. Remove it from **Coming up** and add the next one.
5. Upload, then clear the CloudFront cache (below).

## Newsletter (Kit)

The form posts to Kit form 10020926. In Kit, the form's settings should
redirect to `https://greatplateausacademy.com/thanks.html` and send the
incentive (confirmation) email.

## Deploy to S3 + CloudFront

```bash
aws s3 sync . s3://YOUR-BUCKET --delete \
  --exclude ".git/*" --exclude "README.md" --exclude "src/*"

# Make PDFs download instead of opening in the browser tab (optional)
aws s3 cp downloads/ s3://YOUR-BUCKET/downloads/ --recursive \
  --content-type application/pdf --content-disposition attachment \
  --metadata-directive REPLACE

# Clear the CDN cache so changes show up right away
aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"
```

404 page: in CloudFront, add custom error responses for **403** and **404**
that return `/404.html` with response code **404**.

## Accessibility checklist (each new printable)

Target: WCAG 2.2 Level AA.

- [ ] Preview image has `alt` text that says what's in it
- [ ] Download link keeps the hidden title (`<span class="sr-only">: Title</span>`)
- [ ] The PDF itself is tagged (export as "Tagged PDF", with a title)
- [ ] Tab through the page: every link and button shows a focus ring
- [ ] New colors? Check contrast at webaim.org/resources/contrastchecker
      (4.5:1 for text, 3:1 for large text and focus rings)