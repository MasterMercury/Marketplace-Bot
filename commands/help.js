const { MessageEmbed } = require("discord.js");
const fs = require("fs");
const Color = require("../colors.json");

exports.run = async (Client, Message, Args) => {

    const ServerId = ``; // 1 here
    const AdminServerId = ``; // 1 here
    var HelpEmbedDescription = `List of commands, how to use them, and their description.\nParameters surrounded by [] are necessary parameters, and those surrounded by () are optional parameters.\n\n`
    var AdminHelpEmbedDescription = `List of commands, how to use them, and their description.\nParameters surrounded by [] are necessary parameters, and those surrounded by () are optional parameters.\n\n`
    var AdminCommandArray = [`approve`, `decline`, `pending`, `remove`, `collect`]

    fs.readdir(`./commands/`, (Error, Files) => {
        Files.forEach(File => {
            if (!File.endsWith(`.js`)) return;
            let Props = require(`../commands/${File}`);
            let Command = File.split(".")[0];
            var Aliases = ``
            var Groups = ``
            for (Name = 0; Name < Props.info.names.length;  Name++) {
                if (Props.info.names[Name] !== Command && Name + 1 !== Props.info.names.length) {
                    Aliases += `${Props.info.names[Name]}, `
                } else if (Props.info.names[Name] !== Command && Name + 1 == Props.info.names.length) {
                    Aliases += `${Props.info.names[Name]}`
                }
            }
            for (Group = 0; Group < Props.info.groups.length;  Group++) {
                if (Group + 1 !== Props.info.groups.length) {
                    Groups += `${Props.info.groups[Group]}, `
                } else {
                    Groups += `${Props.info.groups[Group]}`
                }
            }
            if (!AdminCommandArray.includes(Command)) {
                if (Aliases !== `` && Groups !== ``) {
                    HelpEmbedDescription += `**Command:** \`${Command}\`\n**Usage:** \`${Props.info.usage}\`\n**Aliases:** \`${Aliases}\`\n**Description:** \`${Props.info.description}\`\n**Groups:** \`${Groups}\`\n\n`
                } else if (Groups !== ``){
                    HelpEmbedDescription += `**Command:** \`${Command}\`\n**Usage:** \`${Props.info.usage}\`\n**Description:** \`${Props.info.description}\`\n**Groups:** \`${Groups}\`\n\n`
                } else if (Aliases !== ``) {
                    HelpEmbedDescription += `**Command:** \`${Command}\`\n**Usage:** \`${Props.info.usage}\`\n**Aliases:** \`${Aliases}\`\n**Description:** \`${Props.info.description}\`\n\n`
                } else {
                    HelpEmbedDescription += `**Command:** \`${Command}\`\n**Usage:** \`${Props.info.usage}\`\n**Description:** \`${Props.info.description}\`\n\n`
                }
            }
            if (Aliases !== `` && Groups !== ``) {
                AdminHelpEmbedDescription += `**Command:** \`${Command}\`\n**Usage:** \`${Props.info.usage}\`\n**Aliases:** \`${Aliases}\`\n**Description:** \`${Props.info.description}\`\n**Groups:** \`${Groups}\`\n\n`
            } else if (Groups !== ``) {
                AdminHelpEmbedDescription += `**Command:** \`${Command}\`\n**Usage:** \`${Props.info.usage}\`\n**Description:** \`${Props.info.description}\`\n**Groups:** \`${Groups}\`\n\n`
            } else if (Aliases !== ``) {
                AdminHelpEmbedDescription += `**Command:** \`${Command}\`\n**Usage:** \`${Props.info.usage}\`\n**Aliases:** \`${Aliases}\`\n**Description:** \`${Props.info.description}\`\n\n`
            } else {
                AdminHelpEmbedDescription += `**Command:** \`${Command}\`\n**Usage:** \`${Props.info.usage}\`\n**Description:** \`${Props.info.description}\n\n`
            }
        });
    });

    setTimeout(function() {
        const HelpEmbed = new MessageEmbed()
            .setColor(Color.general)
            .setTitle(`**Information Embed**`)
        if (Message.guild.id == ServerId) {
            HelpEmbed.setDescription(`${HelpEmbedDescription}`)
        } else if (Message.guild.id == AdminServerId) {
            HelpEmbed.setDescription(`${AdminHelpEmbedDescription}`)
        }
        return Message.author.send({ embeds: [HelpEmbed] }).then(HelpEmbed => {
            Message.react(`✅`)
        }).catch(function(Error) {
            console.log(Error)
            Message.react(`❌`)
        })
    }, 50)
};

exports.info = {
    names: ["help", "info"],
    groups: [],
    usage: 'help',
    description: 'Lists commands, how to use them, and their description'
};