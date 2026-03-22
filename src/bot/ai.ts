import OpenAI from 'openai';

export class AIProvider {
  private _openai: OpenAI | null = null;
  private _perplexity: OpenAI | null = null;
  private model: string = 'gpt-4o-mini';
  private perplexityModel: string = 'sonar';

  private get openai() {
    if (!this._openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is missing. Please add it to the Secrets menu.');
      }
      this._openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return this._openai;
  }

  private get perplexity() {
    if (!this._perplexity) {
      if (!process.env.PERPLEXITY_API_KEY) {
        throw new Error('PERPLEXITY_API_KEY is missing. Please add it to the Secrets menu.');
      }
      this._perplexity = new OpenAI({
        apiKey: process.env.PERPLEXITY_API_KEY,
        baseURL: 'https://api.perplexity.ai',
      });
    }
    return this._perplexity;
  }

  async generateResponse(messages: any[], systemInstruction: string) {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemInstruction },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    return response.choices[0].message.content;
  }

  async transcribeVoice(fileStream: any) {
    const response = await this.openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
    });
    return response.text;
  }

  async generateSpeech(text: string) {
    const mp3 = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  }

  async searchResources(query: string) {
    const response = await this.perplexity.chat.completions.create({
      model: this.perplexityModel,
      messages: [
        { role: 'system', content: 'Ты — помощник, который находит ресурсы в России (клиники, книги, курсы, статьи). Отвечай на РУССКОМ языке.' },
        { role: 'user', content: query }
      ],
    });
    return response.choices[0].message.content;
  }

  async summarize(history: string) {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'Кратко резюмируй историю диалога на РУССКОМ языке, сохраняя ключевые инсайты и контекст пользователя.' },
        { role: 'user', content: history }
      ],
    });
    return response.choices[0].message.content;
  }
}

export const aiProvider = new AIProvider();
