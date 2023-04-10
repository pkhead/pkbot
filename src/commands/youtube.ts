import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { voiceStart, VoiceError } from "../voice";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('youtube')
		.setDescription('Play a YouTube video')
        .addStringOption((option: SlashCommandStringOption) =>
            option.setName("url")
                .setDescription("The URL of the YouTube video to play")
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
                try {
                    const songInfo = (await voiceStart(url, member, guild)).player_response.videoDetails;
                    await interaction.reply(`Playing "${songInfo.title}" by ${songInfo.author}`);
                } catch (e) {
                    if (e instanceof VoiceError) {
                        await interaction.reply("You are not in a voice channel")
                    } else {
                        await interaction.reply("Error");
                    }
                }
            } else {
                await interaction.reply("Please specify url");
            }
        } else {
            await interaction.reply("Unknown error");
        }
	},
};