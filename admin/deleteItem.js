const { SlashCommandBuilder } = require('discord.js');
const { isAdmin } = require('../utils/permissions');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleteitem')
        .setDescription('Delete an item by ID (admin only)')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('Item ID to delete')
                .setRequired(true)),
    
    async execute(interaction) {
        if (!isAdmin(interaction.member)) {
            return interaction.reply({ content: '❌ Admins only', flags: 64 });
        }

        const id = interaction.options.getInteger('id');

        try {
            const item = await db.deleteItem(id);
            await interaction.reply(`✅ Item "${item.name}" deleted`);
        } catch (error) {
            await interaction.reply({ content: '❌ Item not found', flags: 64 });
        }
    }
};