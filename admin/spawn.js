const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isAdmin, isOwner } = require('../utils/permissions');
const db = require('../database/db');

const rarityWeights = {
    'Common': 1000,
    'Rare': 600,
    'Very Rare': 200,
    'Epic': 80,
    'Legendary': 20,
    'Heroic': 10,
    'Mythic': 5,
    'Exotic': 1
};

function getRandomRarity() {
    const total = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
    let random = Math.floor(Math.random() * total);

    for (const [rarity, weight] of Object.entries(rarityWeights)) {
        random -= weight;
        if (random < 0) return rarity;
    }
    return 'Common';
}

async function spawnItem(channel) {
    const items = await db.getAllItems();
    const rarity = getRandomRarity();
    const eligibleItems = items.filter(item => item.rarity === rarity);

    if (eligibleItems.length === 0) {
        return null;
    }

    const selectedItem = eligibleItems[Math.floor(Math.random() * eligibleItems.length)];

    const embed = new EmbedBuilder()
        .setTitle('🎮 An item just spawned!')
        .setColor(0xFFFF00)
        .setTimestamp();
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('catch')
                .setLabel('Catch Me!')
                .setStyle(ButtonStyle.Primary)
        );
    
    const message = await channel.send({ embeds: [embed], components: [row] });
    
    const collector = message.createMessageComponentCollector({ time: 30000 });

    return new Promise((resolve) => {
        collector.on('collect', async (i) => {
            await db.addItemToUser(i.user.id, selectedItem.id);
            collector.stop();

            const revealEmbed = new EmbedBuilder()
                .setTitle('🎉 Item Caught!')
                .setDescription(`${i.user} caught **${selectedItem?.name || 'Unknown'}!**`)
                .addFields(
                    { name: 'ID', value: selectedItem?.id?.toString() || 'N/A', inline: true },
                    { name: 'Type', value: selectedItem?.type || 'N/A', inline: true },
                    { name: 'Rarity', value: selectedItem?.rarity || 'N/A', inline: true }
                )
                .setColor(0x00FF00)
                .setTimestamp();

            await i.reply({ embeds: [revealEmbed] });
            resolve({ caught: true, user: i.user, item: selectedItem });
        });

        collector.on('end', (collected, reason) => {
            if (!collected.size) {
                message.edit({ components: [] }).catch(() => {});
                resolve({ caught: false });
            }
        });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spawn')
        .setDescription('Spawn items (admin only)')
        .addIntegerOption(option => 
            option.setName('number')
                .setDescription('Number of items to spawn')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const member = interaction.member;
        const userId = interaction.user.id;
        const count = interaction.options.getInteger('number');

        if (!isAdmin(member) && !isOwner(userId)) {
            return interaction.reply({ content: '❌ Admins only', flags: 64 });
        }

        const maxSpawn = isOwner(userId) ? Infinity : 200;
        if (count > maxSpawn) {
            return interaction.reply({ content: `❌ Max ${maxSpawn} spawns for admins`, flags: 64 });
        }

        await interaction.reply(`✅ Spawning ${count} items...`);

        const channel = interaction.channel;

        let spawned = 0;
        const spawnInterval = setInterval(() => {
            if (spawned >= count) {
                clearInterval(spawnInterval);
                return;
            }
            spawnItem(channel);
            spawned++;
        }, 5000);
    }
}