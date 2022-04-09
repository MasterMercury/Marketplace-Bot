const axios = require("axios");
const Discord = require("discord.js");
const Color = require("../colors.json");

module.exports = async (Client, Message) => {

    const Config = require('../settings/config.json')
    if (Message.channel.type === "dm") {
        return;
    }
    if (Message.author.bot) {
        return;
    }

    let PrefixArray = Config.prefix;
    var PrefixUsed = null;

    for (let i = 0; i < PrefixArray.length; i++) {
        if (!Message.content.toLowerCase().startsWith(PrefixArray[i].toLowerCase())) {
            continue;
        } else {
            PrefixUsed = PrefixArray[i]
            break;
        }
    }

    if (Message.author.bot) {
        return;
    }

    if (PrefixUsed !== null) {
        const ArgsContent = Message.content.substring(PrefixUsed.length);
        const Args = ArgsContent.split(/[ ]+/);
        Args.map(Arg => Arg.toLowerCase())
        if (Args[0] == "help") {
            const Command = Args[0];
            const Cmd = Client.commands.get(Command);
            if (!Cmd) {
                return;
            }

            Cmd.run(Client, Message, Args);
        } else {
            const Command = Args[1];
            const Cmd = Client.commands.get(Command);
            if (!Cmd) {
                return;
            }

            var MatchesGroup = false;
            for (Group = 0; Group < Cmd.info.groups.length; Group++) {
                if (Cmd.info.groups[Group] == Args[0].toLowerCase()) {
                    MatchesGroup = true;
                }
            }

            if (MatchesGroup == true) {
                Args.shift();
            } else {
                return;
            }

            const BlacklistedUsersIds = [];
            for (let i = 0; i < BlacklistedUsersIds.length; i++) {
                if (Message.author.id === BlacklistedUsersIds[i]) {
                    return Message.reply(`You are on the bot blacklist, you cannot use commands for this bot anywhere!`);
                }
            };

            Cmd.run(Client, Message, Args);
        }
    } else {
        var CurrentDate = new Date()

        if (CurrentDate.getDate() > 21) {
            return;
        } else {
            if (Message.channel.id == ``) { // 1 here
                Message.react(`👍`)
                .then(() => Message.react(`💛`))
                .then(() => Message.react(`🤩`))
            }
        }
    }
};
