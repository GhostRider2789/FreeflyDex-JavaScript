const { SlashCommandBuilder } = require('discord.js');
const { isOwner } = require('../utils/permissions');
const fs = require('fs');
const path = require('path');

const DB_DIR = __dirname + '/../database';
const ITEMS_FILE = path.join(DB_DIR, 'items.json');
const USERS_FILE = path.join(DB_DIR, 'users.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletedb')
        .setDescription('Delete entire database (owner only)'),

    async execute(interaction) {
        if (!isOwner(interaction.user.id)) {
            return interaction.reply({ content: '❌ Owner only', flags: 64 });
        }

        await fs.promises.writeFile(ITEMS_FILE, JSON.stringify({ nextId: 1, items: [] }, null, 2));
        await fs.promises.writeFile(USERS_FILE, JSON.stringify({}, null, 2));

        await interaction.reply('✅ Database deleted and reset');
    }
}