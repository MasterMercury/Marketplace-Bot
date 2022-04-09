const Discord = require("discord.js");
const axios = require("axios");
const admin = require("firebase-admin");
const Color = require("../colors.json");

exports.run = async (Client, Message, Args) => {

    const CommandChannel = await Client.channels.cache.find(channel => channel.id == (``)); // 1 here
    var PendingDescription = ``;

    if (Message.channel !== CommandChannel) {
        return;
    }

    await axios.get(`${Client.config.firebase_url}/pending-approval.json`)
    .then(async function (response) {
        if (response.data !== null) {
            var PendingDescriptionPart = ``;
            var PendingCount = 0;
            for (var key in response.data) {
                if (response.data.hasOwnProperty(key)) {
                    PendingCount += 1;
                    var MessageAuthor = await Client.users.fetch(`${response.data[key].message_author}`);
                    PendingDescriptionPart += `\n\n${MessageAuthor.tag} | ${response.data[key].mode} | ${response.data[key].title} | ${key} | [Link](https://discord.com/channels/ServerId/${CommandChannel.id}/${response.data[key].message})`; // 1 here
                }
            }
            PendingDescription = `There are currently ${PendingCount} pending post requests.${PendingDescriptionPart}`;
        } else {
            PendingDescription = `There are currently no pending post requests.`
        }
    })

    const PendingEmbed = new Discord.MessageEmbed()
        .setColor(Color.general)
        .setTitle(`Pending Post Requests`)
        .setDescription(PendingDescription)
    return Message.channel.send({ embeds: [PendingEmbed] });
};

exports.info = {
    names: ["pending"],
    groups: ["m", "marketplace"],
    usage: 'pending',
    description: 'Check all the pending post requests'
};
