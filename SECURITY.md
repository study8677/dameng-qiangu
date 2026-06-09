# Security Policy

## Reporting

Please open a private security advisory or contact the maintainer before publicly disclosing security issues.

## Sensitive Keys

The frontend must never contain `OPENAI_API_KEY`. AI requests go through the Vercel Serverless proxy in `api/generate-dream.ts`.

Set `ALLOWED_ORIGIN` on Vercel to the GitHub Pages origin after the public site URL is known. Also configure OpenAI usage limits because the proxy is publicly reachable.

## Supported Surface

- Static frontend hosted on GitHub Pages.
- Vercel API proxy for AI generation.
- User-generated dream data stored locally or shared through URL hash.

## Known MVP Constraints

- No account system or server database in the MVP.
- Shared links can be long because they embed compressed dream JSON.
- Public moderation is not included until the future dream plaza version.
