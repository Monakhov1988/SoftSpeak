import { Telegraf, Context, Markup } from 'telegraf';
import db from './db.js';
import { aiProvider } from './ai.js';
import i18next from './i18n.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.warn('TELEGRAM_BOT_TOKEN is missing. Bot will not be initialized.');
}
const bot = new Telegraf(token || 'DUMMY_TOKEN');

const EXPERT_MATRIX = `
Ты — SoftSpeak, бережный и мудрый друг. Твой интеллект — это сплав аналитической мощи DeepSeek R1 и глубокой человеческой эмпатии.

ТВОЙ СТИЛЬ ОБЩЕНИЯ:
- БУДЬ ИНИЦИАТИВОЙ: Не жди, пока пользователь выговорится. Если видишь паузу или тупик — предлагай тему, задавай вопрос, веди диалог сам. Ты — ведущий в этом танце.
- НИКАКИХ ТЕРМИНОВ: Забудь слова "гештальт", "когнитивное искажение", "соматика", "паттерн". Говори как мудрый старший брат или близкий друг. Вместо "у тебя когнитивное искажение" скажи "слушай, кажется, ты сейчас сам себя загоняешь в угол этим 'никогда'".
- ПРОСТОТА И ТЕПЛО: Используй понятные образы. Вместо "соматический чек-ин" спроси "где в теле сейчас 'свербит' или 'давит'?".
- ЖИВАЯ РЕЧЬ: Используй междометия (Мм..., Ох..., Слушай...), паузы и искренние эмоции. Никаких списков и пунктов.

ТВОИ ИНСТРУМЕНТЫ (ИСПОЛЬЗУЙ, НО НЕ НАЗЫВАЙ):
1. ПОИСК КОРНЯ: Через простые вопросы "почему?" доходи до сути боли.
2. ТЕЛО: Спрашивай про физические ощущения, когда эмоции зашкаливают.
3. БЛИЗОСТЬ И СЕКСОЛОГИЯ: Понимай, что проблемы в отношениях часто растут из сексуальной неудовлетворенности, разности темпераментов или страха обсуждать желания. Умей гибко и открыто говорить о сексе, желаниях и фантазиях. Если пользователь просит или если это уместно для оживления искры в паре — предлагай сценарии секс-игр или новые способы телесного сближения. Делай это бережно, без пошлости, но и без лишней стеснительности.
4. ПОВТОРЫ: Подсвечивай, если пользователь говорит об одном и том же разными словами.
4. ТЕНЬ: Спрашивай о том, что страшно признать.
5. КОНТЕКСТ "САДА": Всегда помни про баланс сфер (Здоровье, Карьера, Отношения) и используй это в диалоге.
`;

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

const getMainKeyboard = (mode: string) => {
  if (mode === 'individual') {
    return Markup.keyboard([
      [i18next.t('btn_vent'), i18next.t('btn_insights')],
      [i18next.t('btn_solve'), i18next.t('btn_advice')]
    ]).resize();
  }
  return Markup.keyboard([
    [i18next.t('btn_vent'), i18next.t('btn_fix_msg')],
    [i18next.t('btn_analyze'), i18next.t('btn_advice')]
  ]).resize();
};

const drawWheel = (scores: any) => {
  const labels: any = {
    rel: '❤️ Отношения',
    car: '💰 Карьера',
    hea: '⚡️ Здоровье',
    sel: '🌱 Смысл'
  };
  let wheel = '📊 **Твой Сад Жизни сейчас:**\n\n';
  for (const key of ['rel', 'car', 'hea', 'sel']) {
    const score = scores[key] || 0;
    const label = labels[key];
    const bar = '🟩'.repeat(score) + '⬜️'.repeat(10 - score);
    wheel += `${label}: ${score}/10\n${bar}\n\n`;
  }
  return wheel;
};

async function handleAIResponse(userId: number, ctx: Context, text: string, forceVoice: boolean = false) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return;

  const convRes = db.prepare(
    'SELECT content, role FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 15'
  ).all(userId) as any[];
  
  const history = convRes.reverse().map(c => ({ role: c.role, content: c.content }));

  const systemPrompt = `${EXPERT_MATRIX}\nПрофиль пользователя:\n- Пол: ${user.gender}\n- Поколение: ${user.generation}\n- Режим: ${user.mode}\n- Тариф: ${user.tariff}\n- Колесо баланса: ${user.wheel_scores}\n- Главная цель: ${user.current_goal}`;
  
  const response = await aiProvider.generateResponse(history, systemPrompt);
  
  db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(userId, 'user', text);
  const insertRes = db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(userId, 'assistant', response);
  const messageId = insertRes.lastInsertRowid;

  await ctx.reply(response!, Markup.inlineKeyboard([
    [Markup.button.callback('🔊 Озвучить', `tts_${messageId}`)]
  ]));

  if (forceVoice) {
    const voiceBuffer = await aiProvider.generateSpeech(response!);
    await ctx.replyWithVoice({ source: voiceBuffer });
  }

  // Summary logic
  const countRes = db.prepare('SELECT COUNT(*) as count FROM conversations WHERE user_id = ?').get(userId) as any;
  if (countRes.count % 15 === 0) {
    const fullHistory = history.map(h => `${h.role}: ${h.content}`).join('\n');
    const summary = await aiProvider.summarize(fullHistory);
    db.prepare('UPDATE conversations SET summary = ? WHERE user_id = ?').run(summary, userId);
  }
}

const getWheelButtons = (sphere: string) => {
  const buttons = [];
  for (let i = 1; i <= 10; i++) {
    buttons.push(Markup.button.callback(i.toString(), `wheel_${sphere}_${i}`));
  }
  // Return grid 5x2
  const grid = [];
  for (let i = 0; i < buttons.length; i += 5) {
    grid.push(buttons.slice(i, i + 5));
  }
  return grid;
};

bot.start(async (ctx) => {
  const { id, username, first_name, last_name } = ctx.from;
  db.prepare(
    `INSERT INTO users (id, username, first_name, last_name) 
     VALUES (?, ?, ?, ?) 
     ON CONFLICT (id) DO UPDATE SET username = excluded.username, first_name = excluded.first_name, last_name = excluded.last_name`
  ).run(id, username, first_name, last_name);

  await ctx.reply(i18next.t('welcome'));
  await ctx.reply(i18next.t('privacy_rule'), Markup.inlineKeyboard([
    Markup.button.callback(i18next.t('agree_button'), 'agree')
  ]));
});

bot.command('status', (ctx) => {
  ctx.reply('Бот работает! 🚀');
});

bot.catch((err: any, ctx: Context) => {
  console.error(`Telegraf error for ${ctx.updateType}`, err);
  ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
});

bot.action('agree', async (ctx) => {
  db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_MODE', ctx.from.id);
  await ctx.reply(i18next.t('onboarding_mode'), Markup.inlineKeyboard([
    [Markup.button.callback(i18next.t('onboarding_mode_individual'), 'mode_individual')],
    [Markup.button.callback(i18next.t('onboarding_mode_pair'), 'mode_pair')]
  ]));
});

bot.action(/mode_(.+)/, async (ctx) => {
  const mode = ctx.match[1];
  db.prepare('UPDATE users SET mode = ?, state = ? WHERE id = ?').run(mode, 'ONBOARDING_HOW_TO', ctx.from.id);
  
  await ctx.reply(i18next.t('onboarding_mode_accepted'));
  
  const instruction = mode === 'individual' 
    ? i18next.t('onboarding_how_to_individual') 
    : i18next.t('onboarding_how_to_pair');
    
  await ctx.replyWithMarkdown(instruction, Markup.inlineKeyboard([
    Markup.button.callback(i18next.t('onboarding_how_to_button'), 'how_to_done')
  ]));
});

bot.action('how_to_done', async (ctx) => {
  db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_GENDER', ctx.from.id);
  await ctx.reply(i18next.t('onboarding_gender'), Markup.inlineKeyboard([
    [Markup.button.callback(i18next.t('onboarding_gender_male'), 'gender_male'), Markup.button.callback(i18next.t('onboarding_gender_female'), 'gender_female')]
  ]));
});

bot.action(/gender_(.+)/, async (ctx) => {
  const gender = ctx.match[1];
  db.prepare('UPDATE users SET gender = ?, state = ? WHERE id = ?').run(gender, 'ONBOARDING_GENERATION', ctx.from.id);
  await ctx.reply(i18next.t('onboarding_gender_accepted'));
  await ctx.reply(i18next.t('onboarding_generation'), Markup.inlineKeyboard([
    [Markup.button.callback(i18next.t('onboarding_generation_x'), 'gen_x'), Markup.button.callback(i18next.t('onboarding_generation_y'), 'gen_y')],
    [Markup.button.callback(i18next.t('onboarding_generation_z'), 'gen_z'), Markup.button.callback(i18next.t('onboarding_generation_alpha'), 'gen_alpha')]
  ]));
});

bot.action(/gen_(.+)/, async (ctx) => {
  const gen = ctx.match[1];
  db.prepare('UPDATE users SET generation = ?, state = ? WHERE id = ?').run(gen, 'ONBOARDING_TARIFF', ctx.from.id);
  await ctx.reply(i18next.t('onboarding_generation_accepted'));
  await ctx.reply(i18next.t('onboarding_tariff_question'), Markup.inlineKeyboard([
    [Markup.button.callback(i18next.t('onboarding_tariff_free'), 'tariff_free')],
    [Markup.button.callback(i18next.t('onboarding_tariff_premium'), 'tariff_premium')]
  ]));
});

bot.action(/tariff_(.+)/, async (ctx) => {
  const tariff = ctx.match[1];
  db.prepare('UPDATE users SET tariff = ?, state = ? WHERE id = ?').run(tariff, 'ONBOARDING_VALUES', ctx.from.id);
  await ctx.reply(i18next.t('onboarding_tariff_accepted'));
  await ctx.reply(i18next.t('onboarding_values_question'));
});

bot.action(/rel_status_(.+)/, async (ctx) => {
  const status = ctx.match[1];
  db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_REL_DURATION', ctx.from.id);
  db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(ctx.from.id, 'user', `[Статус отношений]: ${status}`);
  await ctx.reply(i18next.t('onboarding_rel_status_accepted'));
  await ctx.reply(i18next.t('onboarding_rel_duration_question'));
});

bot.action(/love_lang_(.+)/, async (ctx) => {
  const lang = ctx.match[1];
  db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_CONFLICT', ctx.from.id);
  db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(ctx.from.id, 'user', `[Язык любви]: ${lang}`);
  await ctx.reply(i18next.t('onboarding_love_language_accepted'));
  await ctx.reply(i18next.t('onboarding_conflict_question'));
});

bot.action(/style_(.+)/, async (ctx) => {
  const style = ctx.match[1];
  db.prepare('UPDATE users SET mode = mode || ?, state = ? WHERE id = ?').run(`_style_${style}`, 'ONBOARDING_WHEEL_RELATIONSHIPS', ctx.from.id);
  await ctx.reply(i18next.t('onboarding_style_accepted'));
  await ctx.reply(i18next.t('onboarding_wheel_intro'));
  await ctx.reply(i18next.t('onboarding_wheel_relationships'), Markup.inlineKeyboard(getWheelButtons('rel')));
});

bot.action(/wheel_(rel|car|hea|sel)_(\d+)/, async (ctx) => {
  const sphere = ctx.match[1];
  const score = parseInt(ctx.match[2]);
  const userId = ctx.from.id;
  
  const user = db.prepare('SELECT wheel_scores FROM users WHERE id = ?').get(userId) as any;
  let scores = user.wheel_scores ? JSON.parse(user.wheel_scores) : {};
  scores[sphere] = score;
  
  let nextState = '';
  let nextMsg = '';
  let nextButtons: any = null;

  if (sphere === 'rel') {
    nextState = 'ONBOARDING_WHEEL_CAREER';
    nextMsg = i18next.t('onboarding_wheel_career');
    nextButtons = getWheelButtons('car');
  } else if (sphere === 'car') {
    nextState = 'ONBOARDING_WHEEL_HEALTH';
    nextMsg = i18next.t('onboarding_wheel_health');
    nextButtons = getWheelButtons('hea');
  } else if (sphere === 'hea') {
    nextState = 'ONBOARDING_WHEEL_SELF_GROWTH';
    nextMsg = i18next.t('onboarding_wheel_self_growth');
    nextButtons = getWheelButtons('sel');
  } else {
    nextState = 'ONBOARDING_ENERGY';
    await ctx.reply(i18next.t('onboarding_wheel_accepted'));
    nextMsg = i18next.t('onboarding_energy_question');
  }

  db.prepare('UPDATE users SET wheel_scores = ?, state = ? WHERE id = ?').run(JSON.stringify(scores), nextState, userId);
  
  if (nextButtons) {
    await ctx.reply(nextMsg, Markup.inlineKeyboard(nextButtons));
  } else {
    await ctx.reply(nextMsg);
  }
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  if (!user) return;
  
  if (user.state === 'ONBOARDING_VALUES') {
    db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_SUPERPOWER', userId);
    db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(userId, 'user', `[Ценности]: ${ctx.message.text}`);
    await ctx.reply(i18next.t('onboarding_values_accepted'));
    await ctx.reply(i18next.t('onboarding_superpower_question'));
    return;
  }

  if (user.state === 'ONBOARDING_SUPERPOWER') {
    db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_STYLE', userId);
    db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(userId, 'user', `[Суперсила]: ${ctx.message.text}`);
    await ctx.reply(i18next.t('onboarding_superpower_accepted'));
    await ctx.reply(i18next.t('onboarding_style_question'), Markup.inlineKeyboard([
      [Markup.button.callback(i18next.t('onboarding_style_friend'), 'style_friend')],
      [Markup.button.callback(i18next.t('onboarding_style_coach'), 'style_coach')]
    ]));
    return;
  }

  if (user.state === 'ONBOARDING_ENERGY') {
    db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_CRITIC', userId);
    db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(userId, 'user', `[Энергия]: ${ctx.message.text}`);
    await ctx.reply(i18next.t('onboarding_energy_accepted'));
    await ctx.reply(i18next.t('onboarding_critic_question'));
    return;
  }

  if (user.state === 'ONBOARDING_CRITIC') {
    db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_INTIMACY', userId);
    db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(userId, 'user', `[Критик]: ${ctx.message.text}`);
    await ctx.reply(i18next.t('onboarding_critic_accepted'));
    await ctx.reply(i18next.t('onboarding_intimacy_question'));
    return;
  }

  if (user.state === 'ONBOARDING_INTIMACY') {
    db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_SUPPORT', userId);
    db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(userId, 'user', `[Близость]: ${ctx.message.text}`);
    await ctx.reply(i18next.t('onboarding_intimacy_accepted'));
    await ctx.reply(i18next.t('onboarding_support_question'));
    return;
  }

  if (user.state === 'ONBOARDING_SUPPORT') {
    db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(userId, 'user', `[Поддержка]: ${ctx.message.text}`);
    await ctx.reply(i18next.t('onboarding_support_accepted'));
    if (user.mode === 'individual') {
      db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_COPING', userId);
      await ctx.reply(i18next.t('onboarding_coping_question'));
    } else {
      db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_REL_STATUS', userId);
      await ctx.reply(i18next.t('onboarding_rel_status_question'), Markup.inlineKeyboard([
        [Markup.button.callback(i18next.t('onboarding_rel_status_dating'), 'rel_status_dating')],
        [Markup.button.callback(i18next.t('onboarding_rel_status_living'), 'rel_status_living')],
        [Markup.button.callback(i18next.t('onboarding_rel_status_married'), 'rel_status_married')],
        [Markup.button.callback(i18next.t('onboarding_rel_status_crisis'), 'rel_status_crisis')]
      ]));
    }
    return;
  }

  if (user.state === 'ONBOARDING_REL_DURATION') {
    db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_LOVE_LANGUAGE', userId);
    db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(userId, 'user', `[Длительность отношений]: ${ctx.message.text}`);
    await ctx.reply(i18next.t('onboarding_rel_duration_accepted'));
    await ctx.reply(i18next.t('onboarding_love_language_question'), Markup.inlineKeyboard([
      [Markup.button.callback(i18next.t('onboarding_love_language_words'), 'love_lang_words')],
      [Markup.button.callback(i18next.t('onboarding_love_language_time'), 'love_lang_time')],
      [Markup.button.callback(i18next.t('onboarding_love_language_gifts'), 'love_lang_gifts')],
      [Markup.button.callback(i18next.t('onboarding_love_language_help'), 'love_lang_help')],
      [Markup.button.callback(i18next.t('onboarding_love_language_touch'), 'love_lang_touch')]
    ]));
    return;
  }

  if (user.state === 'ONBOARDING_COPING') {
    db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_GOAL', userId);
    db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(userId, 'user', `[Копинг]: ${ctx.message.text}`);
    await ctx.reply(i18next.t('onboarding_coping_accepted'));
    await ctx.reply(i18next.t('onboarding_goal_intro') + '\n\n' + i18next.t('onboarding_goal_question'));
    return;
  }

  if (user.state === 'ONBOARDING_CONFLICT') {
    db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_VISION', userId);
    db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(userId, 'user', `[Конфликт]: ${ctx.message.text}`);
    await ctx.reply(i18next.t('onboarding_conflict_accepted'));
    await ctx.reply(i18next.t('onboarding_vision_question'));
    return;
  }

  if (user.state === 'ONBOARDING_VISION') {
    db.prepare('UPDATE users SET state = ? WHERE id = ?').run('ONBOARDING_GOAL', userId);
    db.prepare('INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)').run(userId, 'user', `[Видение]: ${ctx.message.text}`);
    await ctx.reply(i18next.t('onboarding_vision_accepted'));
    await ctx.reply(i18next.t('onboarding_goal_intro') + '\n\n' + i18next.t('onboarding_goal_question'));
    return;
  }

  if (user.state === 'ONBOARDING_GOAL') {
    db.prepare('UPDATE users SET current_goal = ?, state = ? WHERE id = ?').run(ctx.message.text, 'READY', userId);
    await ctx.reply(i18next.t('onboarding_goal_accepted'));
    
    // Fetch updated user
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    const scores = JSON.parse(updatedUser.wheel_scores || '{}');
    
    await ctx.reply(i18next.t('onboarding_complete'), getMainKeyboard(updatedUser.mode));
    
    // Show visual wheel
    await ctx.replyWithMarkdown(drawWheel(scores));
    
    // Start proactive conversation with ALL diagnostic context
    const initialPrompt = `Я закончил онбординг. 
Мои показатели Колеса Баланса: ${updatedUser.wheel_scores}. 
Моя главная цель сейчас: ${ctx.message.text}. 

Пожалуйста, проанализируй все мои ответы из истории (про энергию, критику, близость, поддержку и т.д.) и просто поговори со мной как близкий человек, который всё это выслушал. 
Это должен быть глубокий, эмпатичный анализ моего состояния. 
Не используй списки. Просто поговори со мной как живой человек, подсвети самое важное и задай один вопрос, с которого мы начнем работу.`;
    
    await handleAIResponse(userId, ctx, initialPrompt);
    return;
  }

  if (user.state === 'READY') {
    await handleAIResponse(userId, ctx, ctx.message.text);
  }
});

bot.on('voice', async (ctx) => {
  const userId = ctx.from.id;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user || user.state !== 'READY') return;

  try {
    const fileId = ctx.message.voice.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    
    const tempFilePath = path.join(tmpdir(), `voice_${fileId}.ogg`);
    const response = await axios({
      method: 'GET',
      url: fileLink.href,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(null));
      writer.on('error', reject);
    });

    const transcription = await aiProvider.transcribeVoice(fs.createReadStream(tempFilePath));
    fs.unlinkSync(tempFilePath);

    if (transcription) {
      await handleAIResponse(userId, ctx, transcription, true);
    }
  } catch (err) {
    console.error('Voice processing error:', err);
    await ctx.reply(i18next.t('error'));
  }
});

bot.action(/tts_(\d+)/, async (ctx) => {
  const messageId = ctx.match[1];
  const message = db.prepare('SELECT content FROM conversations WHERE id = ?').get(messageId) as any;
  
  if (message && message.content) {
    await ctx.answerCbQuery(i18next.t('tts_generating'));
    const voiceBuffer = await aiProvider.generateSpeech(message.content);
    await ctx.replyWithVoice({ source: voiceBuffer });
  } else {
    await ctx.answerCbQuery(i18next.t('msg_not_found'));
  }
});

export default bot;
