require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ContextMenuCommandBuilder, ApplicationCommandType, Partials } = require('discord.js');
const translate = require('translate-google-api');

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const PREFIX = '!';

// Flag emoji to language code mapping (supports both Unicode and Discord emoji names)
const flagToLang = {
  // Unicode flags
  '🇺🇸': 'en', '🇬🇧': 'en', // English
  '🇪🇸': 'es', '🇲🇽': 'es', // Spanish
  '🇫🇷': 'fr', // French
  '🇩🇪': 'de', // German
  '🇮🇹': 'it', // Italian
  '🇵🇹': 'pt', '🇧🇷': 'pt', // Portuguese
  '🇷🇺': 'ru', // Russian
  '🇯🇵': 'ja', // Japanese
  '🇰🇷': 'ko', // Korean
  '🇨🇳': 'zh', // Chinese
  '🇸🇦': 'ar', // Arabic
  '🇮🇳': 'hi', // Hindi
  '🇵🇭': 'tl', // Filipino
  '🇳🇱': 'nl', // Dutch
  '🇸🇪': 'sv', // Swedish
  '🇵🇱': 'pl', // Polish
  '🇹🇷': 'tr', // Turkish
  '🇻🇳': 'vi', // Vietnamese
  '🇹🇭': 'th', // Thai
  '🇮🇩': 'id', // Indonesian
  
  // Discord emoji names (without colons)
  'flag_us': 'en', 'flag_gb': 'en', 'flag_uk': 'en',
  'flag_es': 'es', 'flag_mx': 'es',
  'flag_fr': 'fr',
  'flag_de': 'de',
  'flag_it': 'it',
  'flag_pt': 'pt', 'flag_br': 'pt',
  'flag_ru': 'ru',
  'flag_jp': 'ja',
  'flag_kr': 'ko',
  'flag_cn': 'zh',
  'flag_sa': 'ar',
  'flag_in': 'hi',
  'flag_ph': 'tl',
  'flag_nl': 'nl',
  'flag_se': 'sv',
  'flag_pl': 'pl',
  'flag_tr': 'tr',
  'flag_vn': 'vi',
  'flag_th': 'th',
  'flag_id': 'id',
};

// Language codes mapping
const languageCodes = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
  hi: 'Hindi',
  tl: 'Filipino',
  nl: 'Dutch',
  sv: 'Swedish',
  pl: 'Polish',
  tr: 'Turkish',
  vi: 'Vietnamese',
  th: 'Thai',
  id: 'Indonesian',
};

client.once('ready', async () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
  client.user.setActivity('React with flags to translate!', { type: 'WATCHING' });

  // Register context menu commands
  const commands = [
    new ContextMenuCommandBuilder()
      .setName('Translate to English')
      .setType(ApplicationCommandType.Message),
    new ContextMenuCommandBuilder()
      .setName('Translate to Spanish')
      .setType(ApplicationCommandType.Message),
    new ContextMenuCommandBuilder()
      .setName('Translate to French')
      .setType(ApplicationCommandType.Message),
    new ContextMenuCommandBuilder()
      .setName('Translate to Japanese')
      .setType(ApplicationCommandType.Message),
  ];

  try {
    await client.application.commands.set(commands);
    console.log('✅ Context menu commands registered!');
  } catch (error) {
    console.log('Error registering commands:', error);
  }
});

// Handle context menu interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isMessageContextMenuCommand()) return;

  const targetMessage = interaction.targetMessage;
  let targetLang;

  // Determine target language from command name
  if (interaction.commandName === 'Translate to English') targetLang = 'en';
  else if (interaction.commandName === 'Translate to Spanish') targetLang = 'es';
  else if (interaction.commandName === 'Translate to French') targetLang = 'fr';
  else if (interaction.commandName === 'Translate to Japanese') targetLang = 'ja';

  if (!targetMessage.content) {
    return interaction.reply({ content: '❌ This message has no text to translate!', ephemeral: true });
  }

  await interaction.deferReply();

  try {
    const result = await translate(targetMessage.content, { to: targetLang });
    const translatedText = result[0];
    const detectedLang = result[1];

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🌐 Translation')
      .addFields(
        {
          name: `Original (${languageCodes[detectedLang] || detectedLang})`,
          value: targetMessage.content.substring(0, 1024),
        },
        {
          name: `Translated (${languageCodes[targetLang] || targetLang})`,
          value: translatedText.substring(0, 1024),
        }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.log('Translation error:', error);
    await interaction.editReply({ content: '❌ Translation failed. Please try again.' });
  }
});

// Handle reaction-based translation
client.on('messageReactionAdd', async (reaction, user) => {
  console.log('=== Reaction Event Triggered ===');
  console.log('User:', user.tag);
  console.log('User is bot:', user.bot);
  
  // Ignore bot reactions
  if (user.bot) {
    console.log('Ignoring bot reaction');
    return;
  }

  // Fetch partial reactions and messages
  if (reaction.partial) {
    try {
      await reaction.fetch();
      console.log('Fetched partial reaction');
    } catch (error) {
      console.log('Error fetching reaction:', error);
      return;
    }
  }

  if (reaction.message.partial) {
    try {
      await reaction.message.fetch();
      console.log('Fetched partial message');
    } catch (error) {
      console.log('Error fetching message:', error);
      return;
    }
  }

  const emoji = reaction.emoji.name;
  console.log('Emoji name:', emoji);
  console.log('Emoji ID:', reaction.emoji.id);
  console.log('Is custom emoji:', !!reaction.emoji.id);
  
  const targetLang = flagToLang[emoji];
  console.log('Target language:', targetLang);

  // Check if the reaction is a flag emoji we support
  if (!targetLang) {
    console.log('Emoji not in mapping, ignoring');
    return;
  }

  const message = reaction.message;

  // Check if message has content
  if (!message.content) {
    console.log('Message has no content to translate');
    return;
  }

  console.log('Message content:', message.content.substring(0, 50) + '...');

  try {
    console.log('Starting translation...');
    const result = await translate(message.content, { to: targetLang });
    const translatedText = result[0];
    const detectedLang = result[1];

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle(`🌐 Translation via ${emoji}`)
      .addFields(
        {
          name: `Original (${languageCodes[detectedLang] || detectedLang})`,
          value: message.content.substring(0, 1024),
        },
        {
          name: `Translated (${languageCodes[targetLang] || targetLang})`,
          value: translatedText.substring(0, 1024),
        }
      )
      .setFooter({ text: `Requested by ${user.tag}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    console.log(`✅ Translation successful: ${detectedLang} -> ${targetLang}`);
  } catch (error) {
    console.log('❌ Translation error:', error);
    // Optionally send error message to user
    try {
      await message.reply(`❌ Translation failed: ${error.message}`);
    } catch (e) {
      console.log('Failed to send error message:', e);
    }
  }
});

// Handle text commands
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'translate' || command === 't') {
    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `!translate <language> <text>` or `!t <language> <text>`\nExample: `!translate es Hello world`'
      );
    }

    const targetLang = args[0].toLowerCase();
    const textToTranslate = args.slice(1).join(' ');

    try {
      const result = await translate(textToTranslate, { to: targetLang });
      const translatedText = result[0];
      const detectedLang = result[1];

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🌐 Translation')
        .addFields(
          {
            name: `Original (${languageCodes[detectedLang] || detectedLang})`,
            value: textToTranslate,
          },
          {
            name: `Translated (${languageCodes[targetLang] || targetLang})`,
            value: translatedText,
          }
        )
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.log('Translation error:', error);
      message.reply('❌ Translation failed. Please check the language code and try again.');
    }
  } else if (command === 'flags') {
    const flagList = Object.entries(flagToLang)
      .map(([flag, code]) => `${flag} → **${languageCodes[code] || code}**`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor('#ffaa00')
      .setTitle('🚩 Supported Flag Reactions')
      .setDescription(flagList + '\n\n**How to use:** React to any message with a flag emoji to translate it!')
      .setFooter({ text: 'Just click on a message and add a flag reaction!' });

    message.reply({ embeds: [embed] });
  } else if (command === 'languages' || command === 'langs') {
    const langList = Object.entries(languageCodes)
      .map(([code, name]) => `**${code}** - ${name}`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('📚 Supported Languages')
      .setDescription(langList + '\n\n...and many more! Use the 2-letter ISO code.')
      .setFooter({ text: 'Full list: https://cloud.google.com/translate/docs/languages' });

    message.reply({ embeds: [embed] });
  } else if (command === 'help') {
    const embed = new EmbedBuilder()
      .setColor('#ffaa00')
      .setTitle('🤖 Translator Bot Help')
      .setDescription('Translate text between different languages using Google Translate.')
      .addFields(
        {
          name: '🎯 Interactive Translation',
          value:
            '**Right-click a message** → Apps → Translate to [Language]\n' +
            '**React with a flag emoji** (🇪🇸 🇫🇷 🇯🇵) to translate any message!',
        },
        {
          name: '📝 Text Commands',
          value:
            '`!translate <lang> <text>` - Translate text to specified language\n' +
            '`!t <lang> <text>` - Short version of translate\n' +
            '`!flags` - Show all supported flag emojis\n' +
            '`!languages` - Show common language codes\n' +
            '`!help` - Show this help message',
        },
        {
          name: '💡 Examples',
          value:
            '`!translate es Hello, how are you?`\n' +
            '`!t fr Good morning`\n' +
            'React with 🇯🇵 to translate to Japanese\n' +
            'Right-click message → Apps → Translate to English',
        }
      )
      .setFooter({ text: 'Language codes are 2-letter ISO codes (en, es, fr, etc.)' });

    message.reply({ embeds: [embed] });
  }
});

// Login to Discord
const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.log('❌ ERROR: DISCORD_BOT_TOKEN is not set in environment variables!');
  process.exit(1);
}

client.login(token).catch(error => {
  console.log('❌ Failed to login to Discord:', error);
  process.exit(1);
});
