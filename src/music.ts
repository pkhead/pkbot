import { Guild, GuildMember } from "discord.js";
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
    public voice: VoiceConnection | null
    public queue: MusicQueueEntry[]

    constructor() {
        this.voice = null;
        this.queue = [];
    }
}

const guildDataMap: Map<string, GuildData> = new Map();
const getGuildData = (id: string) => guildDataMap.get(id) || guildDataMap.set(id, new GuildData()).get(id);

export class VoiceError extends Error {};

export function getQueue(guildId: string): MusicQueueEntry[] | undefined {
    return getGuildData(guildId)?.queue;
}

export async function addToQueue(guildId: string, item: MusicQueueEntry): Promise<string> {
    let guildData = getGuildData(guildId);
    if (!guildData) {
        return "ERROR!"
    }

    guildData.queue.push(item);

    const songInfo = await item.getData();
    return `Added to queue "${songInfo.title}" by ${songInfo.author}`;
}

export async function addURLToQueue(guildId: string, urlStr: string): Promise<string> {
    let url;

    try {
        url = new URL(urlStr);
    } catch (e) {
        return "That's not a valid URL.";
    }

    if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com" || url.hostname === "youtu.be") {
        return await addToQueue(guildId, new MusicQueueYoutubeEntry(urlStr));
    } else {
        return "I don't know what that website that is."
    }
}

export async function voiceStart(member: GuildMember, guild: Guild): Promise<string> {
    let guildData = getGuildData(guild.id);
    if (!guildData) {
        throw new ReferenceError();
    }

    const voiceData = member.voice;

    if (voiceData && voiceData.channelId) {
        let queue = guildData.queue;

        if (queue && queue.length > 0) {
            if (guildData?.voice?.joinConfig.channelId !== voiceData.channelId) {
                guildData?.voice?.destroy();
            }

            guildData.voice = joinVoiceChannel({
                channelId: voiceData.channelId,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
            });

            const player = createAudioPlayer();

            player.on("error", err => {
                console.error("Error:", err.message);
            });
            
            guildData.voice.subscribe(player);
            
            let cur = queue.shift();

            if (cur) {
                const audioResource = createAudioResource(cur.createStream());
                player.play(audioResource);
                console.log("play the stupid song!!!");
                
                const songInfo = await cur.getData();

                return `Playing "${songInfo.title}" by ${songInfo.author}`;
            }
        } else {
            return "Queue is empty";
        }
    }

    return "You are not in a voice channel";
};

export function voiceStop(guildId: string) {
    let guildData = guildDataMap.get(guildId);

    if (guildData && guildData.voice) {
        guildData.voice.destroy();
        guildData.voice = null;

        return true;
    }

    return false;
}