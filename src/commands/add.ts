import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { MusicError, addURLToQueue } from "../music";

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
                await interaction.deferReply();

                try {
                    const songInfo = await addURLToQueue(guildId, url);
                    await interaction.editReply(`Added \`${songInfo.title}\` by \`${songInfo.author}\``);
                } catch (e) {
                    if (e instanceof MusicError) {
                        await interaction.followUp(e.message);
                    } else {
                        console.error(e);
                        await interaction.followUp("ERROR!");
                    }
                }
            } else {
                await interaction.reply("I need a valid URL!");
            }
        } else {
            await interaction.reply("ERROR!");
        }
	},
};