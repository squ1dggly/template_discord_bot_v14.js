const { Schema, model } = require("mongoose");

const config = { client: require("../configs/config_client.json") };

const schema_guild = new Schema(
	{
		_id: { type: String, require: true },

		prefix: { type: String, default: config.client.PREFIX },

		timestamp_joined: { type: Number, default: Date.now() }
	},
	{ collection: "guilds" }
);

module.exports = {
	schema: schema_guild,
	model: model("guilds", schema_guild)
};
