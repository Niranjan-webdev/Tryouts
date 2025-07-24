require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;

(async () => {
  const diff = fs.readFileSync('pr.diff', 'utf8');

  const prompt = `
You are an expert code reviewer. Review this GitHub Pull Request diff:

${diff}

Focus only on:
- Syntax errors
- Redundant variables
- Optimization suggestions (if any)
Return the feedback in clear markdown.
`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'codellama-70b-instruct', // You can also try llama3-8b-8192
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

    console.log(response.data.choices[0].message.content);
  } catch (error) {
    console.error('❌ Error from Groq API:', error.response?.data || error.message);
    process.exit(1);
  }
})();
