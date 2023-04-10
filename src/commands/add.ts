import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { addURLToQueue } from "../music";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Add a song to queue')
        .addStringOption((option: SlashCommandStringOption) =>
            option.setName("url")
                .setDescription("The URL of the song to add")
                .setRequired(true)),
    
	async execute(interaction: ChatInputCommandInteraction) {
        const member = interaction.member;
        const guild = interaction.guild;
        const guildId = interaction.guildId;

        if (!member || !guild || !guildId) {
            return;
        }

        if (member instanceof GuildMember) {
            const url = interaction.options.getString("url");

            if (url) {
                interaction.deferReply();
                await interaction.editReply(await addURLToQueue(guildId, url));
            } else {
                await interaction.reply("I need a valid YouTube URL!");
            }
        } else {
            await interaction.reply("ERROR!");
        }
	},
};