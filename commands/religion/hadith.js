const { EmbedBuilder, ApplicationCommandOptionType, MessageFlags } = require('discord.js');
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { HadithsAPI } = require('../../apis/hadiths_api.js');
const { formatText } = require('../../utils/string_utils.js');
const hadithsAPI = new HadithsAPI();

const BOOK_PARAM_NAME = 'book';
const CHAPTER_PARAM_NAME = 'chapter';
const HADITH_PARAM_NAME = 'hadith';

module.exports.help = {
   name: 'hadith',
   description: 'Get for a hadith',
   options: [
      {
         name: BOOK_PARAM_NAME,
         description: 'Which book to use for the hadith',
         type: ApplicationCommandOptionType.String,
         required: true,
         choices: hadithsAPI.hadithsBooks.map((book) => ({
            name: book.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
            value: book,
         })),
      },
      {
         name: CHAPTER_PARAM_NAME,
         description: 'Which chapter to use for the hadith (autocomplete)',
         type: ApplicationCommandOptionType.Integer,
         required: true,
         autocomplete: true,
         min_value: 1,
      },
      {
         name: HADITH_PARAM_NAME,
         description: 'Hadith (number) to retrieve',
         type: ApplicationCommandOptionType.Integer,
         required: true,
         min_value: 1,
      },
   ],
};

module.exports.run = async (_client, interaction) => {
   // Get the value of the option "enable"
   const book = interaction.options.getString(BOOK_PARAM_NAME);
   const chapterNumber = interaction.options.getInteger(CHAPTER_PARAM_NAME);
   const hadithNumber = interaction.options.getInteger(HADITH_PARAM_NAME);
   if (book === null || chapterNumber === null || hadithNumber === null) {
      return interaction.reply({
         content: 'You must specify the book, chapter and hadith number',
         flags: MessageFlags.Ephemeral,
      });
   }
   logger.info(`Hadith requested: ${book} - Chapter: ${chapterNumber} - Hadith: ${hadithNumber}`);

   // Get the hadith from the API
   const hadith = (await hadithsAPI.getHadith(book, chapterNumber, hadithNumber).catch(error => {
      logger.error('Error during retrieve hadith', error);
      return interaction.reply({ content: 'An error occurred while retrieving the hadith', flags: MessageFlags.Ephemeral });
   }));



   if (!hadith) {
      return interaction.reply({ content: 'Hadith not found', flags: MessageFlags.Ephemeral });
   }

   // Send a message to the user
   const englishEmbed = new EmbedBuilder()
      .setTitle(`🇬🇧 Hadith from ${formatText(hadith.book.bookName)} - ${formatText(hadith.book.writerName)}`)
      .addFields([
         {
            name: `Chapter Name`,
            value: formatText(hadith.chapter.chapterEnglish),
            inline: true,
         }
      ])
      .setDescription(`${formatText(hadith.hadithEnglish)}`)
      .setColor(vars.primaryColor)
      .setFooter({
         text: `${vars.footerText}`, iconURL: 'https://i.imgur.com/DCFtkTv.png'
      });
   const arabicEmbed = new EmbedBuilder()
      .setTitle(`🇸🇦 Hadith from ${formatText(hadith.book.bookName)} - ${formatText(hadith.book.writerName)}`)
      .addFields([
         {
            name: `Chapter Name`,
            value: formatText(hadith.chapter.chapterArabic),
            inline: true,
         }
      ])
      .setDescription(`
         ${formatText(hadith.hadithArabic)}
      `)
      .setColor(vars.primaryColor)
      .setFooter({
         text: `${vars.footerText}`, iconURL: 'https://i.imgur.com/DCFtkTv.png'
      });

   interaction.reply({ embeds: [englishEmbed, arabicEmbed] });
};

module.exports.autocomplete = async (interaction) => {
   const focusedOption = interaction.options.getFocused(true);
   const focusedValue = interaction.options.getFocused();
   let choices;

   if (focusedOption.name === CHAPTER_PARAM_NAME) {
      const book = interaction.options.getString(BOOK_PARAM_NAME);
      choices = (await hadithsAPI.getChapters(book)).map((chapter) => ({ name: chapter.chapterEnglish, value: chapter.chapterNumber }));
   }

   // Ensure focused value is processed correctly (case-insensitive search)
   const filtered = choices
      .filter(choice => {
         if (focusedValue === null) return true;
         return choice.name.toLowerCase().startsWith(focusedValue.toLowerCase())
      })
      .slice(0, 25); // Limit to 25 suggestions

   // Respond to the interaction within 3 seconds
   await interaction.respond(filtered).catch(error => {
      throw new Error('Error responding to autocomplete interaction:', error);
   });
};