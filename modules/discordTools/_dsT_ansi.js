/** @typedef {"normal"|"bold"|"underline"} ansi_format */
/** @typedef {"gray"|"red"|"green"|"yellow"|"blue"|"pink"|"cyan"|"white"} ansi_colors_text */
/** @typedef {"firefly_dark_blue"|"orange"|"marble_blue"|"grayish_turqouise"|"gray"|"indigo"|"light_gray"|"white"} ansi_colors_bg */

/** @typedef ansi_options
 * @property {ansi_format} format
 * @property {ansi_colors_text} text_color
 * @property {ansi_colors_bg} bg_color
 * @property {boolean} codeblock add the returned text into a message-ready ansi codeblock*/

const config = require("./_dsT_config.json");

const ansi_format_keys = Object.keys(config.ansi.formats);
const ansi_colors_text_keys = Object.keys(config.ansi.colors.text);
const ansi_colors_bg_keys = Object.keys(config.ansi.colors.bg);

/** function description
 * @param {string} str
 * @param {ansi_options} options */
function ansi(str, options) {
	options = { format: "normal", text_color: "", bg_color: "", codeblock: false, ...options };

	/// Error handling
	// prettier-ignore
	if (!ansi_format_keys.includes(options.format.toUpperCase()))
        throw new TypeError(`Invalid format: \`${options.format || "undefined"}\` is not ${ansi_format_keys.join(", ")}`);
	// prettier-ignore
	if (options.bg_color && !ansi_colors_bg_keys.includes(options.bg_color.toUpperCase()))
        throw new TypeError(`Invalid bg color: \`${options.bg_color || "undefined"}\` is not ${ansi_colors_bg_keys.join(", ")}`);
	// prettier-ignore
	if (options.text_color && !ansi_colors_text_keys.includes(options.text_color.toUpperCase()))
		throw new TypeError(`Invalid text color: \`${options.text_color || "undefined"}\` is not ${ansi_colors_text_keys.join(", ")}`);

	// Apply formatting
	let ansi = "$ESC[$FORMAT;$BG;$TEXTm$STR$ESC[0m"
		.replace(/\$ESC/g, config.ansi.ESCAPE)
		.replace("$FORMAT", config.ansi.formats[options.format.toUpperCase()])
		.replace("$BG;", options.bg_color ? `${config.ansi.colors.bg[options.bg_color.toUpperCase()]};` : "")
		.replace("$TEXT", options.text_color ? config.ansi.colors.text[options.text_color.toUpperCase()] : "")
		.replace("$STR", str);

	return options.codeblock ? `\`\`\`ansi\n${ansi}\n\`\`\`` : ansi;
}

module.exports = ansi;
