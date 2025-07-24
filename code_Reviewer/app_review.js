require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

(async () => {
  const diff = fs.readFileSync('pr.diff', 'utf8');

  const prompt = `
You are an expert code reviewer. Review this code diff:

${diff}

Focus on:
- Syntax errors
- Redundant variables
- Optimal suggestions only if required
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  console.log(response.choices[0].message.content);
})();
