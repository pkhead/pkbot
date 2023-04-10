import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";
import { voiceStart } from "../music";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play the songs in the queue'),
    
	async execute(interaction: ChatInputCommandInteraction) {
        const member = interaction.member;
        const guild = interaction.guild;
        const guildId = interaction.guildId;

        if (!member || !guild || !guildId) {
            return;
        }

        if (member instanceof GuildMember) {
            await interaction.reply(await voiceStart(member, guild));
        } else {
            await interaction.reply("ERROR!");
        }
	},
};