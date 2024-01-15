const models = { guild: require("../../models/guildModel").model };

/** @param {string} guild_id */
async function exists(guild_id) {
	return (await models.guild.exists({ _id: guild_id })) ? true : false;
}

/** @param {string} guild_id */
async function insert(guild_id) {
	if (await exists(guild_id)) return;

	let doc = new models.guild({ _id: guild_id });
	return await doc.save();
}

/** @param {string} guild_id @param {{}} query @param {boolean} upsert */
async function fetch(guild_id, query = {}, upsert = false) {
	if (!(await exists(guild_id)) && upsert) return await insert(guild_id);

	return (await models.guild.findById(guild_id, query).lean()) || null;
}

/** @param {string} guild_id @param {{}} query @param {boolean} upsert */
async function update(guild_id, query, upsert = false) {
	return await models.guild.findByIdAndUpdate(guild_id, query), { upsert };
}

/** @param {string} guild_id */
async function fetchPrefix(guild_id) {
	return (await fetch(guild_id, { prefix: 1 }, true)).prefix || null;
}

/** @param {string} guild_id @param {string} prefix */
async function setPrefix(guild_id, prefix) {
	await update(guild_id, { prefix }, true);
}

module.exports = {
	exists,
	fetch,
	update,
	insert,
	fetchPrefix,
	setPrefix
};
