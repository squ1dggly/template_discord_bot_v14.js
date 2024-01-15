const { Message } = require("discord.js");

/** Returns the content of the provided message, including `Embeds`, split by each word 
 * @param {Message} message
 * @param {Number|null} embedDepth amount of `embeds` to parse in the `Message` | `null` (unlimited) is default */
function messageToArray(message, embedDepth = null) {
	let content = [];

	if (message.content) content.push(...message.content.toLowerCase().split(" "));

	if (message?.embeds?.length) {
		// Go through the embeds
		for (let embed of message.embeds.slice(0, embedDepth ? embedDepth : message.embeds.length)) {
			if (embed?.title) content.push(...embed.title.split(" "));
			if (embed?.author?.name) content.push(...embed.author.name.split(" "));

			if (embed?.description) content.push(...embed.description.split(" "));

			if (embed?.fields?.length) {
				for (let field of embed.fields) {
					if (field?.name) content.push(...field.name.split(" "));
					if (field?.value) content.push(...field.value.split(" "));
				}
			}

			if (embed?.footer?.text) content.push(...embed.footer.text.split(" "));
		}
	}

	// Parse and return content
	return content.map(str => str.trim().toLowerCase()).filter(str => str);
}

module.exports = messageToArray;
