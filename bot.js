
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const translate = require('translate-google-api');

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const PREFIX = '!';

// Flag emoji to language code mapping
const flagToLang = {
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
    console.error('Error registering commands:', error);
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
    console.error('Translation error:', error);
    await interaction.editReply({ content: '❌ Translation failed. Please try again.' });
  }
});

// Handle reaction-based translation
client.on('messageReactionAdd', async (reaction, user) => {
  // Ignore bot reactions
  if (user.bot) return;

  // Fetch partial reactions
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching reaction:', error);
      return;
    }
  }

  const emoji = reaction.emoji.name;
  const targetLang = flagToLang[emoji];

  // Check if the reaction is a flag emoji we support
  if (!targetLang) return;

  const message = reaction.message;

  // Check if message has content
  if (!message.content) return;

  try {
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
  } catch (error) {
    console.error('Translation error:', error);
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
      console.error('Translation error:', error);
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
console.log("token: ",process.env.DISCORD_BOT_TOKEN);
client.login(process.env.DISCORD_BOT_TOKEN);
