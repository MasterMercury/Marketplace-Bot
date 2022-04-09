const axios = require("axios");
const Discord = require("discord.js");
const Color = require("../colors.json");

module.exports = async (Client, Interaction) => {
    if (Interaction.isButton()) {
        return;
    }
    if (Interaction.isSelectMenu()) {
        await Interaction.deferUpdate();
    }
}