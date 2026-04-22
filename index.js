const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

// Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Commands collection
client.commands = new Collection();
client.adminCommands = new Collection();

// Load admin commands
const adminCommandsPath = path.join(__dirname, "admin");
const adminCommandFiles = fs
  .readdirSync(adminCommandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of adminCommandFiles) {
  const filePath = path.join(adminCommandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    client.adminCommands.set(command.data.name, command);
  }
}

// Handle interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.adminCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client, config);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    await interaction.reply({
      content: "There was an error executing this command!",
      ephemeral: true,
    });
  }
});

// Get bot online and load slash commands
client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  const rest = new REST({ version: "10" }).setToken(config.token);
  const commands = [];
  for (const cmd of client.adminCommands.values()) {
    commands.push(cmd.data.toJSON());
  }
  await rest.put(Routes.applicationCommands(client.user.id), {
    body: commands,
  });
  console.log("✅ Slash commands registered");
});

client.login(config.token);
