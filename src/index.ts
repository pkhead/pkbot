import dotenv from 'dotenv';
dotenv.config();

if (!process.env.TOKEN || !process.env.CLIENT_ID || !process.env.SERVER_ID) {
  throw new Error("auth token not found");
}

import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { CommandDef } from './command_type';
import fs from "fs";
import path from "path";

// create a new clienet instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
  presence: {
    status: 'online'
  }
});

var Commands: Collection<string, CommandDef> = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath) as CommandDef;

  if ("data" in command && "execute" in command) {
    Commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = Commands.get(interaction.commandName);

  if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
})

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as: ${c.user.tag}`);
});

client.login(process.env.TOKEN);