import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true
});

export default openai;