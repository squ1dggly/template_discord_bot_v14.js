const { Schema, model } = require("mongoose");

const schema_user = Schema(
	{
		_id: { type: String, require: true },
		timestamp_started: { type: Number, require: true }
	},
	{ collection: "users" }
);

module.exports = {
	schema: schema_user,
	model: model("users", schema_user)
};
