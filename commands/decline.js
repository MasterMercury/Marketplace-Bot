const Discord = require("discord.js");
const axios = require("axios");
const admin = require("firebase-admin");
const Color = require("../colors.json");

exports.run = async (Client, Message, Args) => {

    var db = admin.database();
    const ApprovalChannel = await Client.channels.cache.find(channel => channel.id == (``)); // 1 here
    var SubmitRun = 0;
    var Submissions = 0;
    var ApprovedSubmissions = 0;
    var DeclinedSubmissions = 0;
    var BatchDeny = false;

    if (Message.channel !== ApprovalChannel) {
        return;
    }

    await axios.get(`${Client.config.firebase_url}/metrics.json`)
    .then(function (response) {
        if (response.data !== null) {
            SubmitRun = response.data.submit_run;
            Submissions = response.data.submissions;
            ApprovedSubmissions = response.data.approved_submissions;
            DeclinedSubmissions = response.data.declined_submissions;
        }
    })

    if (!Args[1]) {
        var ErrorEmbed = new Discord.MessageEmbed()
            .setColor(Color.red)
            .setTitle(`Error`)
            .setDescription(`You must provide a valid request ID to decline.`);
        return Message.channel.send({ embeds: [ErrorEmbed] });
    }


    if (Args[1].toLowerCase() == `batch`) {
        BatchDeny = true;
    }

    if (!Args[2] && BatchDeny == false) {
        var Reason = "Unspecified";
    } else if (Args[2] && BatchDeny == false) {
        var Reason = Args.slice(2).join(" ");
    }

    await axios.get(`${Client.config.firebase_url}/pending-approval/${Args[1]}.json`)
        .then(async function (response) {
            if (BatchDeny == true) {
                return;
            }
            if (response.data == null) {
                var ErrorEmbed = new Discord.MessageEmbed()
                    .setColor(Color.red)
                    .setTitle(`Error`)
                    .setDescription(`You must provide a valid request ID to decline. \`${Args[1]}\` is invalid.`);
                return Message.channel.send({ embeds: [ErrorEmbed] });
            } else if (response.data !== null) {
                var MessageAuthor = await Client.users.fetch(`${response.data.message_author}`) || {
                    name: `Undefined`,
                    tag: `Undefined`,
                    id: `Undefined`,
                    displayAvatarURL: function() {
                        return `https://tickettool.xyz/assets/images/noLogo.png`
                    }
                };

                const EditedEmbed = new Discord.MessageEmbed()
                    .setAuthor(MessageAuthor.tag, MessageAuthor.displayAvatarURL())
                    .setColor(Color.red)
                    .setTitle(`Selling Post Request ${Args[1]} Declined`)
                    .setFooter(`This post has been declined by ${Message.author.tag}: ${Reason}`)
                if (response.data.attachment_type == `Image`) {
                    EditedEmbed.setDescription(`**Title** - ${response.data.title}\n**Description** - ${response.data.description}\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`)
                    EditedEmbed.setImage(`${response.data.attachment.proxyURL}`);
                } else if (response.data.attachment_type == `ImageLink`) {
                    var Image = response.data.attachment;
                    EditedEmbed.setDescription(`**Title** - ${response.data.title}\n**Description** - ${response.data.description}\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`)
                    EditedEmbed.setImage(`${Image}`);
                } else if (response.data.attachment_type == `Link`) {
                    EditedEmbed.setDescription(`**Title** - ${response.data.title}\n**Description** - ${response.data.description}\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}\n**Link** - ${response.data.attachment}`);
                }

                Client.channels.cache.get(`${ApprovalChannel.id}`).messages.fetch(`${response.data.message}`).then(Message => Message.edit({ embeds: [EditedEmbed] }));
                const DeclinedEmbed = new Discord.MessageEmbed()
                    .setColor(Color.red)
                    .setTitle(`${response.data.mode} Post Declined`)
                    .setDescription(`Your ${response.data.mode} post has been declined by ${Message.author}, please contact them if you believe your post was falsely declined. Reason for declination: *${Reason}*`);
                await MessageAuthor.send({ embeds: [DeclinedEmbed] });

                db.ref(`pending-approval/${Args[1]}`).set({
                    message_author: null,
                    message: null,
                    mode: null,
                    title: null,
                    description: null,
                    contact: null,
                    pricing: null,
                    attachment_type: null,
                    attachment: null
                })

                db.ref(`metrics`).set({
                    submit_run: SubmitRun,
                    submissions: Submissions,
                    approved_submissions: ApprovedSubmissions,
                    declined_submissions: DeclinedSubmissions + 1
                })
            }
        })
    if (BatchDeny == true) {
        if (!Args[2] || !Args[3]) {
            var ErrorEmbed = new Discord.MessageEmbed()
                .setColor(Color.red)
                .setTitle(`Error`)
                .setDescription(`You must provide at least two valid request IDs to decline.`);
            return Message.channel.send({ embeds: [ErrorEmbed] });
        }
        for (BatchArgs = 0; BatchArgs < Args.length; BatchArgs++) {
            var BatchError = false;
            if (BatchArgs == 0 || BatchArgs == 1) {
                continue;
            }
            await axios.get(`${Client.config.firebase_url}/pending-approval/${Args[BatchArgs]}.json`)
            .then(async function (response) {
                if (response.data == null) {
                    var ErrorEmbed = new Discord.MessageEmbed()
                        .setColor(Color.red)
                        .setTitle(`Error`)
                        .setDescription(`You must provide a valid request ID to decline. \`${Args[BatchArgs]}\` is invalid.`);
                    Message.channel.send({ embeds: [ErrorEmbed] });
                    BatchError = true;
                    return;
                } else if (response.data !== null) {
                    var MessageAuthor = await Client.users.fetch(`${response.data.message_author}`) || {
                        name: `Undefined`,
                        tag: `Undefined`,
                        id: `Undefined`,
                        displayAvatarURL: function() {
                            return `https://tickettool.xyz/assets/images/noLogo.png`
                        }
                    };

                    const EditedEmbed = new Discord.MessageEmbed()
                        .setAuthor(MessageAuthor.tag, MessageAuthor.displayAvatarURL())
                        .setColor(Color.red)
                        .setTitle(`Selling Post Request ${Args[BatchArgs]} Declined`)
                        .setFooter(`This post has been declined by ${Message.author.tag}: ${Reason}`)
                    if (response.data.attachment_type == `Image`) {
                        EditedEmbed.setDescription(`**Title** - ${response.data.title}\n**Description** - ${response.data.description}\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`)
                        EditedEmbed.setImage(`${response.data.attachment.proxyURL}`);
                    } else if (response.data.attachment_type == `ImageLink`) {
                        var Image = response.data.attachment;
                        EditedEmbed.setDescription(`**Title** - ${response.data.title}\n**Description** - ${response.data.description}\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`)
                        EditedEmbed.setImage(`${Image}`);
                    } else if (response.data.attachment_type == `Link`) {
                        EditedEmbed.setDescription(`**Title** - ${response.data.title}\n**Description** - ${response.data.description}\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}\n**Link** - ${response.data.attachment}`);
                    }

                    Client.channels.cache.get(`${ApprovalChannel.id}`).messages.fetch(`${response.data.message}`).then(Message => Message.edit({ embeds: [EditedEmbed] }));
                    const ApprovedEmbed = new Discord.MessageEmbed()
                        .setColor(Color.red)
                        .setTitle(`${response.data.mode} Post Declined`)
                        .setDescription(`Your ${response.data.mode} post has been declined by ${Message.author}, please contact them if you believe your post was falsely declined. Reason for declination: *${Reason}*`);
                    await MessageAuthor.send({ embeds: [ApprovedEmbed] });

                    db.ref(`pending-approval/${Args[BatchArgs]}`).set({
                        message_author: null,
                        message: null,
                        mode: null,
                        title: null,
                        description: null,
                        contact: null,
                        pricing: null,
                        attachment_type: null,
                        attachment: null
                    })

                    db.ref(`metrics`).set({
                        submit_run: SubmitRun,
                        submissions: Submissions,
                        approved_submissions: ApprovedSubmissions,
                        declined_submissions: DeclinedSubmissions + 1
                    })
                }
            })
            if (BatchError == true) {
                continue;
            }
        }
    }
};

exports.info = {
    names: ["decline", "deny", "reject"],
    groups: ["m", "marketplace"],
    usage: 'decline [post id] (channel)',
    description: 'Decline a post request'
};
