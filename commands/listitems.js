const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const db = require('../database/db');

const RARITY_ORDER = {
    'Exotic': 8,
    'Mythic': 7,
    'Heroic': 6,
    'Legendary': 5,
    'Epic': 4,
    'Very Rare': 3,
    'Rare': 2,
    'Common': 1
}

const ITEMS_PER_PAGE = 10;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('itemlist')
        .setDescription('View all items by rarity'),
    
    async execute(interaction) {
        const items = await db.getAllItems();

        if (items.length === 0) {
            return interaction.reply('No items in database');
        }

        const sorted = items.sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);
        const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
        let currentPage = 0;

        const getPage = (page) => {
            const start = page * ITEMS_PER_PAGE;
            const pageItems = sorted.slice(start, start + ITEMS_PER_PAGE);

            const embed = new EmbedBuilder()
                .setTitle('📦 Item List')
                .setDescription(`Page ${page + 1}/${totalPages}`)
                .setColor(0x00FF00);
            
            for (const item of pageItems) {
                embed.addFields({
                    name: `${item.name} (ID: ${item.id})`,
                    value: `Type: ${item.type} | Rarity: ${item.rarity}`,
                    inline: false
                });
            }

            return embed;
        };

        const getButtons = (page) => {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('⬅️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('➡️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === totalPages - 1)
                );
        };

        const reply = await interaction.reply({
            embeds: [getPage(currentPage)],
            components: [getButtons(currentPage)]
        });
        const message = await interaction.fetchReply();

        const collector = message.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'prev') currentPage--;
            if (i.customId === 'next') currentPage++;

            await i.update({
                embeds: [getPage(currentPage)],
                components: [getButtons(currentPage)]
            });
        });
    }
}