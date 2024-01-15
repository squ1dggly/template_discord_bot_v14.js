const config = require("./dT_config.json");

const { PermissionFlagsBits } = require("discord.js");

const BetterEmbed = require("./dT_betterEmbed");
const EmbedNavigator = require("./dT_embedNavigator");

const deleteMessageAfter = require("./dT_deleteMessageAfter");
const messageToArray = require("./dT_messageToArray");
const awaitConfirm = require("./dT_awaitConfirm");
const dynaSend = require("./dT_dynaSend");
const ansi = require("./dT_ansi");

const jt = require("../jsTools");

/* Check config file for errors */
// prettier-ignore
if (isNaN(jt.parseTime(config.timeouts.PAGINATION)))
	throw new Error("You must provide a valid time string/number for \`timeouts.PAGINATION\`. Fix this in '_dT_config.json'");
// prettier-ignore
if (!config.timeouts.CONFIRMATION)
	throw new Error("You must provide a valid time string/number for \`timeouts.CONFIRMATION\`. Fix this in '_dT_config.json'");
// prettier-ignore
if (!config.timeouts.ERROR_MESSAGE)
	throw new Error("You must provide a valid time string/number for \`timeouts.ERROR_MESSAGE\`. Fix this in '_dT_config.json'");

// prettier-ignore
for (let [key, val] of Object.entries(config.navigator.buttons)) if (!val.TEXT) throw new Error(
	`\`${key}.TEXT\` is an empty value; This is required to be able to use EmbedNavigator. Fix this in \'_dT_config.json\'`
);

module.exports = {
	BetterEmbed,
	EmbedNavigator,

	deleteMessageAfter,
	messageToArray,
	awaitConfirm,
	dynaSend,

	markdown: {
		ansi,
		link: (label, url, tooltip = "") => `[${label}](${url}${tooltip ? ` "${tooltip}"` : ""})`,
		permissionFlagName: permissionFlagBit => {
			// prettier-ignore
			switch (permissionFlagBit) {
				case PermissionFlagsBits.CreateInstantInvite: return "CreateInstantInvite";
				case PermissionFlagsBits.KickMembers: return "KickMembers";
				case PermissionFlagsBits.BanMembers: return "BanMembers";
				case PermissionFlagsBits.Administrator: return "Administrator";
				case PermissionFlagsBits.ManageChannels: return "ManageChannels";
				case PermissionFlagsBits.ManageGuild: return "ManageGuild";
				case PermissionFlagsBits.AddReactions: return "AddReactions";
				case PermissionFlagsBits.ViewAuditLog: return "ViewAuditLog";
				case PermissionFlagsBits.PrioritySpeaker: return "PrioritySpeaker";
				case PermissionFlagsBits.Stream: return "Stream";
				case PermissionFlagsBits.ViewChannel: return "ViewChannel";
				case PermissionFlagsBits.SendMessages: return "SendMessages";
				case PermissionFlagsBits.SendTTSMessages: return "SendTTSMessages";
				case PermissionFlagsBits.ManageMessages: return "ManageMessages";
				case PermissionFlagsBits.EmbedLinks: return "EmbedLinks";
				case PermissionFlagsBits.AttachFiles: return "AttachFiles";
				case PermissionFlagsBits.ReadMessageHistory: return "ReadMessageHistory";
				case PermissionFlagsBits.MentionEveryone: return "MentionEveryone";
				case PermissionFlagsBits.UseExternalEmojis: return "UseExternalEmojis";
				case PermissionFlagsBits.ViewGuildInsights: return "ViewGuildInsights";
				case PermissionFlagsBits.Connect: return "Connect";
				case PermissionFlagsBits.Speak: return "Speak";
				case PermissionFlagsBits.MuteMembers: return "MuteMembers";
				case PermissionFlagsBits.DeafenMembers: return "DeafenMembers";
				case PermissionFlagsBits.MoveMembers: return "MoveMembers";
				case PermissionFlagsBits.UseVAD: return "UseVAD";
				case PermissionFlagsBits.ChangeNickname: return "ChangeNickname";
				case PermissionFlagsBits.ManageNicknames: return "ManageNicknames";
				case PermissionFlagsBits.ManageRoles: return "ManageRoles";
				case PermissionFlagsBits.ManageWebhooks: return "ManageWebhooks";
				case PermissionFlagsBits.ManageEmojisAndStickers: return "ManageEmojisAndStickers";
				case PermissionFlagsBits.ManageGuildExpressions: return "ManageGuildExpressions";
				case PermissionFlagsBits.UseApplicationCommands: return "UseApplicationCommands";
				case PermissionFlagsBits.RequestToSpeak: return "RequestToSpeak";
				case PermissionFlagsBits.ManageEvents: return "ManageEvents";
				case PermissionFlagsBits.ManageThreads: return "ManageThreads";
				case PermissionFlagsBits.CreatePublicThreads: return "CreatePublicThreads";
				case PermissionFlagsBits.CreatePrivateThreads: return "CreatePrivateThreads";
				case PermissionFlagsBits.UseExternalStickers: return "UseExternalStickers";
				case PermissionFlagsBits.SendMessagesInThreads: return "SendMessagesInThreads";
				case PermissionFlagsBits.UseEmbeddedActivities: return "UseEmbeddedActivities";
				case PermissionFlagsBits.ModerateMembers: return "ModerateMembers";
				case PermissionFlagsBits.ViewCreatorMonetizationAnalytics: return "ViewCreatorMonetizationAnalytics";
				case PermissionFlagsBits.UseSoundboard: return "UseSoundboard";
				case PermissionFlagsBits.UseExternalSounds: return "UseExternalSounds";
				case PermissionFlagsBits.SendVoiceMessages: return "SendVoiceMessages";
			}
		}
	}
};
