import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";
import { voiceStop } from "../music";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Leave the voice channel'),
    
	async execute(interaction: ChatInputCommandInteraction) {
        const member = interaction.member;
        const guild = interaction.guild;
        const guildId = interaction.guildId;

        if (!member || !guild || !guildId) {
            return;
        }

        if (member instanceof GuildMember) {
            if (voiceStop(guildId))
                await interaction.reply("Left the voice channel");
            else
                await interaction.reply("Not in a voice channel");
        } else {
            await interaction.reply("Unknown error");
        }
	},
};