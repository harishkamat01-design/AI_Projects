# Deployment Notes

## Vercel

The React app is located in `test-strategy-app`.

To deploy locally:

1. `cd chapter_03_BLAST_FW/JIRA_AI_TestStrategy_Generator_02/test-strategy-app`
2. `npm install`
3. `npm run build`
4. `npx vercel --prod`

## GitHub

Add, commit, and push the new folder if the repository is already connected.

- `git add chapter_03_BLAST_FW/JIRA_AI_TestStrategy_Generator_02/test-strategy-app`
- `git add chapter_03_BLAST_FW/JIRA_AI_TestStrategy_Generator_02/*.md`
- `git commit -m "Add Jira Test Strategy Generator React app and BLAST docs"
- `git push`
