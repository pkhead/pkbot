import { Interaction, SlashCommandBuilder } from "discord.js";

export interface CommandDef {
    data: SlashCommandBuilder,
    execute: (interaction: Interaction) => void
}