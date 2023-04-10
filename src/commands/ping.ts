const { SlashCommandBuilder } = require('discord.js');
import { CommandDef } from "../command_type";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction: any) {
		await interaction.reply('Pong!');
	},
} as CommandDef;