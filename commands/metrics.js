const Discord = require("discord.js");
const axios = require("axios");
const admin = require("firebase-admin");
const Color = require("../colors.json");

exports.run = async (Client, Message, Args) => {

    var db = admin.database();

    await axios.get(`${Client.config.firebase_url}/metrics.json`)
    .then(function (response) {
        if (response.data !== null) {
            const MetricsEmbed = new Discord.MessageEmbed()
                .setColor(Color.general)
                .setTitle(`**__Marketplace Metrics__**`)
                .setDescription(`**General**\nSubmission commands - ${response.data.submit_run}\nSubmissions - ${response.data.submissions}\nCancelled - ${response.data.submit_run - response.data.submissions}\n\n**Submissions**\nPending submissions - ${response.data.submissions - (response.data.approved_submissions + response.data.declined_submissions)}\nApproved submissions - ${response.data.approved_submissions}\nDeclined submissions - ${response.data.declined_submissions}`);
            return Message.channel.send({ embeds: [MetricsEmbed] });
        }
    })
};

exports.info = {
    names: ["metrics", "stats"],
    groups: ["m", "marketplace"],
    usage: 'metrics',
    description: 'Check the metrics'
};
