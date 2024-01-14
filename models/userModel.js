const { Schema, model } = require("mongoose");

const schema_user = new Schema(
	{
		_id: { type: String, require: true },

		timestamp_started: { type: Number, default: Date.now() }
	},
	{ collection: "users" }
);

module.exports = {
	schema: schema_user,
	model: model("users", schema_user)
};
