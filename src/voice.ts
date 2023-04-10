import { Guild, GuildMember } from "discord.js";
import { VoiceConnection, joinVoiceChannel, DiscordGatewayAdapterCreator, createAudioPlayer, createAudioResource } from "@discordjs/voice";

let voiceConnection: VoiceConnection | null = null;

import ytdl from "ytdl-core";

export class VoiceError extends Error {};

export async function voiceStart(url: string, member: GuildMember, guild: Guild) {
    const voiceData = member.voice;

    console.log(voiceData);

    if (voiceData && voiceData.channelId) {
        if (voiceConnection?.joinConfig.channelId !== voiceData.channelId) {
            voiceConnection?.destroy();
        }

        voiceConnection = joinVoiceChannel({
            channelId: voiceData.channelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
        });

        const player = createAudioPlayer();

        player.on("error", err => {
            console.error("Error:", err.message);
        });
        
        voiceConnection.subscribe(player);

        if (url) {
            const stream = ytdl(url, { quality: "highestaudio", filter: "audioonly" });
            stream.on("end", () => console.log("stream end"));

            const audioResource = createAudioResource(stream);
            player.play(audioResource);
            console.log("play the stupid song!!!");
            
            return await ytdl.getInfo(url);
        }
    }

    throw new VoiceError("You are not in a voice channel");
};

export function voiceStop() {
    if (voiceConnection) {
        voiceConnection.destroy();
        voiceConnection = null;
    }
}