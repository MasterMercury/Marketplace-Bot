const Discord = require("discord.js");
const Color = require("../colors.json");

exports.run = async (Client, Message, Args) => {

    const CommandChannel = await Client.channels.cache.find(channel => channel.id == (``)); // 1 here
    if (Message.channel !== CommandChannel) {
        return;
    }

    const MarketplaceChannels = {
        buying: ``, // 1 here
        hiring: ``, // 1 here
        portfolios: ``, // 1 here
        selling: `` // 1 here
    }

    if (!Args[1] || !MarketplaceChannels[`${Args[1].toLowerCase()}`]) {
        var ErrorEmbed = new Discord.MessageEmbed()
            .setColor(Color.red)
            .setTitle(`Error`)
            .setDescription(`You must provide a valid marketplace channel as your first argument.`);
        return Message.channel.send({ embeds: [ErrorEmbed] });
    }

    if (!Args[2] || isNaN(Args[2])) {
        var ErrorEmbed = new Discord.MessageEmbed()
            .setColor(Color.red)
            .setTitle(`Error`)
            .setDescription(`You must provide a valid Message id from the respective marketplace channel.`);
        return Message.channel.send({ embeds: [ErrorEmbed] });
    }

    var Reason = ``;
    if (Args[3]) {
        for (Arg = 0; Arg < Args.length; Arg++) {
            if (Arg > 2 && Arg !== Args.length - 1) {
                Reason += `${Args[Arg]} `;
            } else if (Arg > 2) {
                Reason += `${Args[Arg]}`;
            }
        }
    } else {
        Reason = `Unspecified`;
    }

    const ChosenChannel = await Client.channels.cache.find(channel => channel.id == (MarketplaceChannels[`${Args[1].toLowerCase()}`]));

    const EditedEmbed = new Discord.MessageEmbed()
        .setColor(Color.red)
        .setTitle(`Removed`)
        .setDescription(`This post has been moderated by ${Message.author}: *${Reason}*`);
    Client.channels.cache.get(`${ChosenChannel.id}`).messages.fetch(`${Args[2]}`).then(Message => Message.edit({ embeds: [EditedEmbed] }));

    const FinishedEmbed = new Discord.MessageEmbed()
        .setColor(Color.green)
        .setTitle(`Success`)
        .setDescription(`The following post has been removed: [Link](https://discord.com/channels/ServerId/${ChosenChannel.id}/${Args[2]})`); // 1 here
    return Message.channel.send({ embeds: [FinishedEmbed] });

};

exports.info = {
    names: ["remove", "delete"],
    groups: ["m", "marketplace"],
    usage: 'remove/delete [marketplace channel] [Message id] (reason)',
    description: 'Removes a Message from the chosen Marketplace channel'
};
