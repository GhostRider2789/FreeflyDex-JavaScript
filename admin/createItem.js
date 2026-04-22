const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isAdmin, isOwner } = require('../utils/permissions');
const db = require('../database/db');

// Rarity choices from config
const config = require('../config.json');
const rarityChoices = Object.keys(config.rarities).map(r => ({ name: r, value: r }));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createitem')
        .setDescription('Create a new item (admin only)')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Item name')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Item type')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('rarity')
                .setDescription('Item rarity')
                .setRequired(true)
                .addChoices(...rarityChoices)),
    
    async execute(interaction, client, config) {
        const member = interaction.member;
        const userId = interaction.user.id;

        // Check admin perms
        if (!isAdmin(member)) {
            return interaction.reply({ content: '❌ FreeflyDex admins only', ephemeral: true });
        }

        const name = interaction.options.getString('name');
        const type = interaction.options.getString('type');
        const rarity = interaction.options.getString('rarity');

        // Mythic and Exotic for owner only (fussy goat)
        if ((rarity === 'Mythic' || rarity === 'Exotic') && !isOwner(userId)) {
            return interaction.reply({ content: '❌ Only Fussy is allowed to make Mythic or Exotic items', ephemeral: true });
        }

        try {
            const newItem = await db.createItem(name, type, rarity);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Item Created')
                .addFields(
                    { name: 'ID', value: newItem.id.toString(), inline: true },
                    { name: 'Name', value: newItem.name, inline: true },
                    { name: 'Type', value: newItem.type, inline: true },
                    { name: 'Rarity', value: newItem.rarity, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Failed to create item due to an error', ephemeral: true });
        }
    }
};