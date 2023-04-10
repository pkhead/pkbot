import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";
import { getQueue } from "../music";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('List the songs in the music queue'),
    
	async execute(interaction: ChatInputCommandInteraction) {
        const member = interaction.member;
        const guild = interaction.guild;
        const guildId = interaction.guildId;

        if (!member || !guild || !guildId) {
            return;
        }

        if (member instanceof GuildMember) {
            const queue = getQueue(guildId);

            if (queue && queue.length > 0) {
                if (queue.length == 1) {
                    await interaction.reply("There is one song in the queue.");
                } else {
                    await interaction.reply(`There are ${queue.length} songs in the queue.`);
                }
            } else {
                await interaction.reply("There are no songs in the queue.");
            }
        } else {
            await interaction.reply("ERROR!");
        }
	},
};