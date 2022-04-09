const Discord = require("discord.js");
const axios = require("axios");
const admin = require("firebase-admin");
const Color = require("../colors.json");

exports.run = async (Client, Message, Args) => {

    var db = admin.database();
    const ApprovalChannel = await Client.channels.cache.find(channel => channel.id == (``)); // 1 here
    const SellingChannel = await Client.channels.cache.find(channel => channel.id == (``)); // 1 here
    const BuyingChannel = await Client.channels.cache.find(channel => channel.id == (``)); // 1 here
    const HiringChannel = await Client.channels.cache.find(channel => channel.id == (``)); // 1 here
    const PortfolioChannel = await Client.channels.cache.find(channel => channel.id == (``)); // 1 here
    var SubmitRun = 0;
    var Submissions = 0;
    var ApprovedSubmissions = 0;
    var DeclinedSubmissions = 0;
    var BatchPost = false;

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
            .setDescription(`You must provide a valid request ID to approve, or include \`batch\` at the beginning, after your command call.`);
        return Message.channel.send({ embeds: [ErrorEmbed] });
    }

    if (Args[1].toLowerCase() == `batch`) {
        BatchPost = true;
    }

    await axios.get(`${Client.config.firebase_url}/pending-approval/${Args[1]}.json`)
        .then(async function (response) {
            if (BatchPost == true) {
                return;
            }
            if (response.data == null) {
                var ErrorEmbed = new Discord.MessageEmbed()
                    .setColor(Color.red)
                    .setTitle(`Error`)
                    .setDescription(`You must provide a valid request ID to approve. \`${Args[1]}\` is invalid.`);
                return Message.channel.send({ embeds: [ErrorEmbed] });
            } else if (response.data !== null) {
                const ChannelArray = [`buying`, `hiring`, `portfolio`, `selling`];
                var FinalMode;
                if (Args[2] && ChannelArray.includes(Args[2].toLowerCase())) {
                    if (Args[2].toLowerCase() == `buying`) {
                        FinalMode = `Buying`;
                    } else if (Args[2].toLowerCase() == `hiring`) {
                        FinalMode = `Hiring`;
                    } else if (Args[2].toLowerCase() == `portfolio`) {
                        FinalMode = `Portfolio`;
                    } else if (Args[2].toLowerCase() == `selling`) {
                        FinalMode = `Selling`;
                    }
                } else if (Args[2]) {
                    var ErrorEmbed = new Discord.MessageEmbed()
                        .setColor(Color.red)
                        .setTitle(`Error`)
                        .setDescription(`You must provide a valid channel.`)
                    return Message.channel.send({ embeds: [ErrorEmbed] });
                } else {
                    FinalMode = response.data.mode;
                }

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
                    .setColor(Color.green)
                    .setTitle(`${FinalMode} Post Request ${Args[1]}`)
                    .setFooter(`This post has been approved by ${Message.author.tag}, it will be available in the respective channel.`)
                if (response.data.attachment_type == `Image`) {
                    var Image = response.data.attachment;
                    EditedEmbed.setDescription(`**Title** - ${response.data.title}\n**Description** - ${response.data.description}\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`)
                    EditedEmbed.setImage(`${Image.proxyURL}`);
                } else if (response.data.attachment_type == `ImageLink`) {
                    var Image = response.data.attachment;
                    EditedEmbed.setDescription(`**Title** - ${response.data.title}\n**Description** - ${response.data.description}\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`)
                    EditedEmbed.setImage(`${Image}`);
                } else if (response.data.attachment_type == `Link`) {
                    EditedEmbed.setDescription(`**Title** - ${response.data.title}\n**Description** - ${response.data.description}\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}\n**Link** - ${response.data.attachment}`);
                }

                Client.channels.cache.get(`${ApprovalChannel.id}`).messages.fetch(`${response.data.message}`).then(Message => Message.edit({ embeds: [EditedEmbed] }));
                const ApprovedEmbed = new Discord.MessageEmbed()
                    .setColor(Color.green)
                    .setTitle(`${FinalMode} Post Approved`)
                    .setDescription(`Your ${response.data.mode} post has been approved by ${Message.author}, it will be available in the respective channel.`);
                await MessageAuthor.send({ embeds: [ApprovedEmbed] });

                if (FinalMode == `Selling`) {
                    const SellingEmbed = new Discord.MessageEmbed()
                        .setColor(Color.selling)
                        .setAuthor(MessageAuthor.tag, MessageAuthor.displayAvatarURL())
                        .setTitle(`**${response.data.title}**`)
                    if (response.data.attachment_type == `Image`) {
                        var Image = response.data.attachment;
                        SellingEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                        SellingEmbed.setImage(`${Image.proxyURL}`)
                    } else if (response.data.attachment_type == `ImageLink`) {
                        var Image = response.data.attachment;
                        SellingEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                        SellingEmbed.setImage(`${Image}`)
                    } else if (response.data.attachment_type == `Link`) {
                        SellingEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}\n**Link** - ${response.data.attachment}`)
                    }
                    await SellingChannel.send({ embeds: [SellingEmbed] });
                } else if (FinalMode == `Buying`) {
                    const BuyingEmbed = new Discord.MessageEmbed()
                        .setColor(Color.buying)
                        .setAuthor(MessageAuthor.tag, MessageAuthor.displayAvatarURL())
                        .setTitle(`**${response.data.title}**`)
                    if (response.data.attachment_type == `Image`) {
                        var Image = response.data.attachment;
                        BuyingEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                        BuyingEmbed.setImage(`${Image.proxyURL}`)
                    } else if (response.data.attachment_type == `ImageLink`) {
                        var Image = response.data.attachment;
                        BuyingEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                        BuyingEmbed.setImage(`${Image}`)
                    } else if (response.data.attachment_type == `Link`) {
                        BuyingEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}\n**Link** - ${response.data.attachment}`)
                    }
                    await BuyingChannel.send({ embeds: [BuyingEmbed] });
                } else if (FinalMode == `Hiring`) {
                    const HiringEmbed = new Discord.MessageEmbed()
                        .setColor(Color.hiring)
                        .setAuthor(MessageAuthor.tag, MessageAuthor.displayAvatarURL())
                        .setTitle(`**${response.data.title}**`)
                    if (response.data.attachment_type == `Image`) {
                        var Image = response.data.attachment;
                        HiringEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                        HiringEmbed.setImage(`${Image.proxyURL}`)
                    } else if (response.data.attachment_type == `ImageLink`) {
                        var Image = response.data.attachment;
                        HiringEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                        HiringEmbed.setImage(`${Image}`)
                    } else if (response.data.attachment_type == `Link`) {
                        HiringEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}\n**Link** - ${response.data.attachment}`)
                    }
                    await HiringChannel.send({ embeds: [HiringEmbed] });
                } else if (FinalMode == `Portfolio`) {
                    const PortfolioEmbed = new Discord.MessageEmbed()
                        .setColor(Color.portfolio)
                        .setAuthor(MessageAuthor.tag, MessageAuthor.displayAvatarURL())
                        .setTitle(`**${response.data.title}**`)
                    if (response.data.attachment_type == `Image`) {
                        var Image = response.data.attachment;
                        PortfolioEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                        PortfolioEmbed.setImage(`${Image.proxyURL}`)
                    } else if (response.data.attachment_type == `ImageLink`) {
                        var Image = response.data.attachment;
                        PortfolioEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                        PortfolioEmbed.setImage(`${Image}`)
                    } else if (response.data.attachment_type == `Link`) {
                        PortfolioEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}\n**Link** - ${response.data.attachment}`)
                    }
                    await PortfolioChannel.send({ embeds: [PortfolioEmbed] });
                }

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
                    approved_submissions: ApprovedSubmissions + 1,
                    declined_submissions: DeclinedSubmissions
                })
            }
        })
    if (BatchPost == true) {
        if (!Args[2] || !Args[3]) {
            var ErrorEmbed = new Discord.MessageEmbed()
                .setColor(Color.red)
                .setTitle(`Error`)
                .setDescription(`You must provide at least two valid request IDs to approve.`);
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
                        .setDescription(`You must provide a valid request ID to approve. \`${Args[BatchArgs]}\` is invalid.`);
                        Message.channel.send({ embeds: [ErrorEmbed] });
                    BatchError = true;
                    return;
                } else if (response.data !== null) {
                    var FinalMode = response.data.mode;
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
                        .setColor(Color.green)
                        .setTitle(`${FinalMode} Post Request ${Args[BatchArgs]}`)
                        .setFooter(`This post has been approved by ${Message.author.tag}, it will be available in the respective channel.`)
                    if (response.data.attachment_type == `Image`) {
                        var Image = response.data.attachment;
                        EditedEmbed.setDescription(`**Title** - ${response.data.title}\n**Description** - ${response.data.description}\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`)
                        EditedEmbed.setImage(`${Image.proxyURL}`);
                    } else if (response.data.attachment_type == `ImageLink`) {
                        var Image = response.data.attachment;
                        EditedEmbed.setDescription(`**Title** - ${response.data.title}\n**Description** - ${response.data.description}\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`)
                        EditedEmbed.setImage(`${Image}`);
                    } else if (response.data.attachment_type == `Link`) {
                        EditedEmbed.setDescription(`**Title** - ${response.data.title}\n**Description** - ${response.data.description}\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}\n**Link** - ${response.data.attachment}`);
                    }

                    Client.channels.cache.get(`${ApprovalChannel.id}`).messages.fetch(`${response.data.message}`).then(Message => Message.edit({ embeds: [EditedEmbed] }));
                    const ApprovedEmbed = new Discord.MessageEmbed()
                        .setColor(Color.green)
                        .setTitle(`${FinalMode} Post Approved`)
                        .setDescription(`Your ${response.data.mode} post has been approved by ${Message.author}, it will be available in the respective channel.`);
                    await MessageAuthor.send({ embeds: [ApprovedEmbed] });

                    if (FinalMode == `Selling`) {
                        const SellingEmbed = new Discord.MessageEmbed()
                            .setColor(Color.selling)
                            .setAuthor(MessageAuthor.tag, MessageAuthor.displayAvatarURL())
                            .setTitle(`**${response.data.title}**`)
                        if (response.data.attachment_type == `Image`) {
                            var Image = response.data.attachment;
                            SellingEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                            SellingEmbed.setImage(`${Image.proxyURL}`)
                        } else if (response.data.attachment_type == `ImageLink`) {
                            var Image = response.data.attachment;
                            SellingEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                            SellingEmbed.setImage(`${Image}`)
                        } else if (response.data.attachment_type == `Link`) {
                            SellingEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}\n**Link** - ${response.data.attachment}`)
                        }
                        await SellingChannel.send({ embeds: [SellingEmbed] });
                    } else if (FinalMode == `Buying`) {
                        const BuyingEmbed = new Discord.MessageEmbed()
                            .setColor(Color.buying)
                            .setAuthor(MessageAuthor.tag, MessageAuthor.displayAvatarURL())
                            .setTitle(`**${response.data.title}**`)
                        if (response.data.attachment_type == `Image`) {
                            var Image = response.data.attachment;
                            BuyingEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                            BuyingEmbed.setImage(`${Image.proxyURL}`)
                        } else if (response.data.attachment_type == `ImageLink`) {
                            var Image = response.data.attachment;
                            BuyingEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                            BuyingEmbed.setImage(`${Image}`)
                        } else if (response.data.attachment_type == `Link`) {
                            BuyingEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}\n**Link** - ${response.data.attachment}`)
                        }
                        await BuyingChannel.send({ embeds: [BuyingEmbed] });
                    } else if (FinalMode == `Hiring`) {
                        const HiringEmbed = new Discord.MessageEmbed()
                            .setColor(Color.hiring)
                            .setAuthor(MessageAuthor.tag, MessageAuthor.displayAvatarURL())
                            .setTitle(`**${response.data.title}**`)
                        if (response.data.attachment_type == `Image`) {
                            var Image = response.data.attachment;
                            HiringEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                            HiringEmbed.setImage(`${Image.proxyURL}`)
                        } else if (response.data.attachment_type == `ImageLink`) {
                            var Image = response.data.attachment;
                            HiringEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                            HiringEmbed.setImage(`${Image}`)
                        } else if (response.data.attachment_type == `Link`) {
                            HiringEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}\n**Link** - ${response.data.attachment}`)
                        }
                        await HiringChannel.send({ embeds: [HiringEmbed] });
                    } else if (FinalMode == `Portfolio`) {
                        const PortfolioEmbed = new Discord.MessageEmbed()
                            .setColor(Color.portfolio)
                            .setAuthor(MessageAuthor.tag, MessageAuthor.displayAvatarURL())
                            .setTitle(`**${response.data.title}**`)
                        if (response.data.attachment_type == `Image`) {
                            var Image = response.data.attachment;
                            PortfolioEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                            PortfolioEmbed.setImage(`${Image.proxyURL}`)
                        } else if (response.data.attachment_type == `ImageLink`) {
                            var Image = response.data.attachment;
                            PortfolioEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}`);
                            PortfolioEmbed.setImage(`${Image}`)
                        } else if (response.data.attachment_type == `Link`) {
                            PortfolioEmbed.setDescription(`*${response.data.description}*\n\n**Pricing** - ${response.data.pricing}\n**Contact Details** - ${response.data.contact}\n**Link** - ${response.data.attachment}`)
                        }
                        await PortfolioChannel.send({ embeds: [PortfolioEmbed] });
                    }

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
                        approved_submissions: ApprovedSubmissions + 1,
                        declined_submissions: DeclinedSubmissions
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
    names: ["approve", "accept", "post"],
    groups: ["m", "marketplace"],
    usage: 'approve (batch) [post id (...)] (channel)',
    description: 'Approve a post request'
};
