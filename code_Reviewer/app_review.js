require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const PR_NUMBER = process.env.PR_NUMBER;

(async () => {
  // Read PR diff
  let diff = '';
  try {
    diff = fs.readFileSync('pr.diff', 'utf8').trim();
    if (!diff) {
      console.warn('⚠️ PR diff is empty. Skipping review.');
      process.exit(0);
    }
  } catch (err) {
    console.error('Failed to read pr.diff:', err.message);
    process.exit(1);
  }

  // Construct the review prompt
  const prompt = `
You are an expert code reviewer. Review the following GitHub Pull Request diff:

${diff}

Focus only on:
- Syntax errors
- Redundant variables
- Optimization suggestions (if any)
Return the feedback in clear markdown format.
`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-70b-8192', // ✅ Groq-supported model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    const review = response.data.choices?.[0]?.message?.content?.trim();

      // Post comment to PR
    await axios.post(
      `https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments`,
      { body: review },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!review) {
      console.error('No content returned from Groq.');
      process.exit(1);
    }
//     if (review.includes('Syntax Errors') || review.includes('not valid JavaScript')) {
//   console.error('Critical issues found. Failing CI to block merge.');
//   process.exit(1); //  Fail GitHub Action to block merge
// }
//   const hasSyntaxErrors = review.includes('Syntax Errors') && !review.includes('None found');
//   const hasInvalidJS = review.includes('not valid JavaScript');
//   if (hasSyntaxErrors || hasInvalidJS) {
//   console.error('Critical issues found. Failing CI to block merge.');
//   process.exit(1);
// }
   const syntaxPattern = /### Syntax Errors\s+None found\.?/i;

if (!syntaxPattern.test(review)) {
  console.error(' Critical issues found. Failing CI to block merge.');
  process.exit(1);
} else {
  console.log('No syntax errors. Merge allowed.');
}
 


    console.log('AI Review:\n');
    console.log(review);
  } catch (error) {
    console.error('Error from Groq API:', error.response?.data || error.message);
    process.exit(1);
  }
})();
