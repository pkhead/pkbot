import { ChatInputCommandInteraction, Guild, GuildMember } from "discord.js";
import { VoiceConnection, joinVoiceChannel, DiscordGatewayAdapterCreator, createAudioPlayer, createAudioResource } from "@discordjs/voice";
import stream from "stream";
import ytdl from "ytdl-core";

export interface MusicData {
    title: string,
    author: string
}

export interface MusicQueueEntry {
    type: string
    createStream(): stream.Readable;
    getData(): Promise<MusicData>
}

export class MusicQueueYoutubeEntry implements MusicQueueEntry {
    public type: string
    public url: string
    private videoDetails: ytdl.videoInfo | null;

    constructor(url: string) {
        this.type = "YouTube";
        this.url = url;
        this.videoDetails = null;
    }

    public createStream() {
        const stream = ytdl(this.url, { quality: "highestaudio", filter: "audioonly" });
        stream.on("end", () => console.log("stream end"));
        return stream;
    }

    public async getData() {
        if (!this.videoDetails) {
            this.videoDetails = await ytdl.getInfo(this.url);
        }

        return {
            title: this.videoDetails.videoDetails.title,
            author: this.videoDetails.videoDetails.author.name
        }
    }
}

class GuildData {
    public voice: VoiceConnection | null = null;
    public queue: MusicQueueEntry[] = [];
    public isPlaying: boolean = false;
}

const guildDataMap: Map<string, GuildData> = new Map();
const getGuildData = (id: string) => guildDataMap.get(id) || guildDataMap.set(id, new GuildData()).get(id);

export class MusicError extends Error {};

export function getQueue(guildId: string): MusicQueueEntry[] | undefined {
    return getGuildData(guildId)?.queue;
}

export async function addToQueue(guildId: string, item: MusicQueueEntry): Promise<MusicData> {
    let guildData = getGuildData(guildId);
    if (!guildData) {
        throw new MusicError("ERROR!");
    }

    guildData.queue.push(item);

    const songInfo = await item.getData();
    return songInfo
}

export async function addURLToQueue(guildId: string, urlStr: string): Promise<MusicData> {
    let url;

    try {
        url = new URL(urlStr);
    } catch (e) {
        throw new MusicError("I need a valid URL!");
    }

    if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com" || url.hostname === "youtu.be") {
        return await addToQueue(guildId, new MusicQueueYoutubeEntry(urlStr));
    } else {
        throw new MusicError("I don't know what that website that is.");
    }
}

export function isPlayingMusic(guildId: string): boolean {
    return getGuildData(guildId)?.isPlaying === true;
}

export async function voiceStart(interaction: ChatInputCommandInteraction, member: GuildMember, guild: Guild): Promise<void> {
    let guildData = getGuildData(guild.id);
    if (!guildData) {
        throw new ReferenceError();
    }

    const voiceData = member.voice;

    if (voiceData && voiceData.channelId) {
        let queue = guildData.queue;

        if (queue && queue.length > 0) {
            // don't leave voice channel if it is the same one
            if (guildData?.voice?.joinConfig.channelId !== voiceData.channelId) {
                guildData?.voice?.destroy();

            }
            
            // join channel if not already in one
            if (!guildData.voice) {
                guildData.voice = joinVoiceChannel({
                    channelId: voiceData.channelId,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
                });
            }

            const player = createAudioPlayer();

            player.on("error", err => {
                console.error("Error:", err.message);
            });
            
            guildData.voice.subscribe(player);
            
            (function play() {
                guildData.isPlaying = true;
                let cur = queue.shift();

                if (cur) {
                    const audioResource = createAudioResource(cur.createStream());
                    player.play(audioResource);
                    audioResource.playStream.on("end", () => setTimeout(() => {
                        if (guildData) {
                            guildData.isPlaying = false;
                            play();
                        }
                    }, 2000));
                    
                    cur.getData().then(songInfo => {
                        try {
                            interaction.followUp(`Playing \'${songInfo.title}\' by \'${songInfo.author}\'`);
                        } catch(e) {
                            console.error(e);
                        }
                    });
                }
            })();
        } else {
            await interaction.followUp("There are no songs in the queue.");
            return;
        }
    } else {
        await interaction.followUp("You are not in a voice channel!");
    }
};

export function voiceStop(guildId: string) {
    let guildData = guildDataMap.get(guildId);

    if (guildData && guildData.voice) {
        guildData.voice.destroy();
        guildData.voice = null;
        guildData.isPlaying = false;

        return true;
    }

    return false;
}