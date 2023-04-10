import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { voiceStart, addURLToQueue, MusicError, isPlayingMusic } from "../music";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play the songs in the queue')
        .addStringOption((option: SlashCommandStringOption) =>
        option.setName("url")
            .setDescription("The URL of the song to play")
            .setRequired(false)
        ),
    
	async execute(interaction: ChatInputCommandInteraction) {
        const member = interaction.member;
        const guild = interaction.guild;
        const guildId = interaction.guildId;

        if (!member || !guild || !guildId) {
            return;
        }

        if (member instanceof GuildMember) {
            await interaction.deferReply();
            const url = interaction.options.getString("url");

            if (url) {
                try {
                    if (isPlayingMusic(guildId)) {
                        const songInfo = await addURLToQueue(guildId, url);
                        await interaction.editReply(`Added \`${songInfo.title}\` by \`${songInfo.author}\``);
                    } else {
                        await addURLToQueue(guildId, url);
                        await voiceStart(interaction, member, guild);
                    }
                } catch (e) {
                    if (e instanceof MusicError) {
                        await interaction.followUp(e.message);
                    } else {
                        console.error(e);
                        await interaction.followUp("ERROR!");
                    }
                }
            } else {
                await voiceStart(interaction, member, guild);
            }
        } else {
            await interaction.reply("ERROR!");
        }
	},
};