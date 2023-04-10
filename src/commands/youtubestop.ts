import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";
import { voiceStop } from "../voice";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('youtubestop')
		.setDescription('Leave the voice channel'),
    
	async execute(interaction: ChatInputCommandInteraction) {
        const member = interaction.member;
        const guild = interaction.guild;
        const guildId = interaction.guildId;

        if (!member || !guild || !guildId) {
            return;
        }

        if (member instanceof GuildMember) {
            voiceStop();
        } else {
            await interaction.reply("Unknown error");
        }
	},
};