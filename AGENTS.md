## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Cloning to a new city

This codebase is a reusable pattern, not Berlin-specific. `docs/new-site-setup-guide.html` documents every step needed to stand up a new city site (worked example: Paris), tagged by who does it (LLM in-repo vs. Dan manually in a dashboard). Read it before starting a new-city clone. Keep it in sync if the setup steps change (new hardcoded strings, new Cloudflare services, schema changes).
