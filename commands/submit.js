const Discord = require("discord.js");
const axios = require("axios");
const admin = require("firebase-admin");
const Color = require("../colors.json");

exports.run = async (Client, Message, Args) => {

    var db = admin.database();
    const InteractionFilter = (Interaction) => {
        return (Interaction.user.id === Message.author.id && !Interaction.user.bot)
    }
    const MessageFilter = (Response) => {
        return (Response.author.id === Message.author.id)
    }
    const ApprovalChannel = await Client.channels.cache.find(channel => channel.id == (``)); // 1 here
    const GCCServerId = ``; // 1 here
    const DeveloperRoleId = ``; // 1 here
    var IsDeveloper = true;
    var SubmitRun = 0;
    var Submissions = 0;
    var ApprovedSubmissions = 0;
    var DeclinedSubmissions = 0;
    var AlreadyOpen = false;
    var DMChannel = Message.author.dmChannel || await Message.author.createDM();
    
    if (Message.guild.id !== GCCServerId) return;

    await axios.get(`${Client.config.firebase_url}/metrics.json`)
    .then(function (response) {
        if (response.data !== null) {
            SubmitRun = response.data.submit_run;
            Submissions = response.data.submissions;
            ApprovedSubmissions = response.data.approved_submissions;
            DeclinedSubmissions = response.data.declined_submissions;
        }
    })

    db.ref(`metrics`).set({
        submit_run: SubmitRun + 1,
        submissions: Submissions,
        approved_submissions: ApprovedSubmissions,
        declined_submissions: DeclinedSubmissions
    })

    if (Args[1] !== `-repeat` && Args[1] !== `-cancel`) {
        await axios.get(`${Client.config.firebase_url}/currently-open/${Message.author.id}.json`)
        .then(async function (response) {
            if (response.data !== null) {
                AlreadyOpen = true;
            } else {
                db.ref(`currently-open/${Message.author.id}`).set({
                    open: true
                })
            }
        })

        if (AlreadyOpen == true) {
            var ErrorEmbed = new Discord.MessageEmbed()
                .setColor(Color.red)
                .setTitle(`Error`)
                .setDescription(`You already have a submit prompt open, please finish or cancel it to start a new one.`);
            return Message.author.send({ embeds: [ErrorEmbed] });
        }

        // MENU
        const MenuEmbed = new Discord.MessageEmbed()
            .setColor(Color.general)
            .setTitle(`Choose an option`)
            .setDescription(`To begin creating a marketplace post, please interact with a button of the channel you wish to make a post in.\n\n🇸 - Selling\n🇧 - Buying\n🇭 - Hiring\n🇵 - Portfolio\n❌ - Cancel`);
        var SelectionMenuActionRow = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId(`MainMenu`)
                    .setPlaceholder(`Please select a channel in the selection box below to post your request to!`)
                    .addOptions([
                        {
                            label: `🇸`,
                            description: `Selling`,
                            value: `Selling`
                        },
                        {
                            label: `🇧`,
                            description: `Buying`,
                            value: `Buying`
                        },
                        {
                            label: `🇭`,
                            description: `Hiring`,
                            value: `Hiring`
                        },
                        {
                            label: `🇵`,
                            description: `Portfolio`,
                            value: `Portfolio`
                        }
                    ])
            )
        const MenuEmbedSent = await Message.author.send({ embeds: [MenuEmbed], components: [SelectionMenuActionRow] });

        const MenuCollector = MenuEmbedSent.channel.createMessageComponentCollector({ InteractionFilter, max: 1, time: 300000 });
        MenuCollector.on(`collect`, (Collected) => {
            if (Collected.values.includes(`Selling`)) {
                if (Message.member.roles.cache.has(DeveloperRoleId)) {
                    DetailsFunction(`Selling`)
                } else {
                    IsDeveloper = false
                    db.ref(`currently-open/${Message.author.id}`).set({
                        open: null
                    })
                    var ErrorEmbed = new Discord.MessageEmbed()
                        .setColor(Color.red)
                        .setTitle(`Error`)
                        .setDescription(`You do not have the developer role, therefore you cannot submit a selling post approval request. This prompt has been cancelled.`)
                    return Message.author.send({ embeds: [ErrorEmbed] });
                }
            } else if (Collected.values.includes(`Buying`)) {
                DetailsFunction(`Buying`)
            } else if (Collected.values.includes(`Hiring`)) {
                DetailsFunction(`Hiring`)
            } else if (Collected.values.includes(`Portfolio`)) {
                if (Message.member.roles.cache.has(DeveloperRoleId)) {
                    DetailsFunction(`Portfolio`)
                } else {
                    IsDeveloper = false;
                    db.ref(`currently-open/${Message.author.id}`).set({
                        open: null
                    })
                    var ErrorEmbed = new Discord.MessageEmbed()
                        .setColor(Color.red)
                        .setTitle(`Error`)
                        .setDescription(`You do not have the developer role, therefore you cannot submit a portfolio post approval request. This prompt has been cancelled.`)
                    return Message.author.send({ embeds: [ErrorEmbed] });
                }
            }
        })

        MenuCollector.on(`end`, (Collected) => {
            if (Collected.size == 0) {
                db.ref(`currently-open/${Message.author.id}`).set({
                    open: null
                })
                var CancelEmbed = new Discord.MessageEmbed()
                    .setColor(Color.red)
                    .setTitle(`Cancelled`)
                    .setDescription(`This prompt has been cancelled for inactivity.`);
                return Message.author.send({ embeds: [CancelEmbed] });
            }
        })
    } else if (Args[1] == `-repeat`) {
        var RepeatMode = ``;
        var Cooldown = false;

        await axios.get(`${Client.config.firebase_url}/currently-open/${Message.author.id}.json`)
        .then(async function (response) {
            if (response.data !== null) {
                AlreadyOpen = true;
            } else {
                db.ref(`currently-open/${Message.author.id}`).set({
                    open: true
                })
            }
        })

        if (AlreadyOpen == true) {
            var ErrorEmbed = new Discord.MessageEmbed()
                .setColor(Color.red)
                .setTitle(`Error`)
                .setDescription(`You already have a submit prompt open, please finish or cancel it to start a new one.`);
            return Message.author.send({ embeds: [ErrorEmbed] });
        }

        await axios.get(`${Client.config.firebase_url}/repeat-storage/${Message.author.id}.json`)
        .then(async function (response) {
            if (response.data !== null) {
                await axios.get(`${Client.config.firebase_url}/pending-approval.json`)
                .then(async function (cooldownresponse) {
                    if (cooldownresponse.data !== null) {
                        for (var key in cooldownresponse.data) {
                            if (cooldownresponse.data.hasOwnProperty(key)) {
                                for (var nextkey in cooldownresponse.data[key]) {
                                    if (nextkey == `message_author` && cooldownresponse.data[key][nextkey] == Message.author.id) {
                                        if (cooldownresponse.data[key].mode == response.data.mode) {
                                            Cooldown = true;
                                            RepeatMode = response.data.mode;
                                        }
                                    } 
                                }
                            }
                        }
                    }
                })
                if (Cooldown == false) {
                    PostApproval(true, response.data.mode, response.data.title, response.data.description, response.data.pricing, response.data.contact, response.data.attachment, response.data.attachment_type)
                }
            } else {
                db.ref(`currently-open/${Message.author.id}`).set({
                    open: null
                })
                var ErrorEmbed = new Discord.MessageEmbed()
                    .setColor(Color.red)
                    .setTitle(`Error`)
                    .setDescription(`I don't have anything stored to repeat. This prompt has been cancelled.`)
                return Message.author.send({ embeds: [ErrorEmbed] });
            }
        })
        if (Cooldown == true) {
            db.ref(`currently-open/${Message.author.id}`).set({
                open: null
            })
            var ErrorEmbed = new Discord.MessageEmbed()
                .setColor(Color.red)
                .setTitle(`Error`)
                .setDescription(`You are on cooldown. You may not send any more ${RepeatMode.toLowerCase()} approval requests until your current one has been handled. This prompt has been cancelled.`)
            return Message.author.send({ embeds: [ErrorEmbed] });
        }
    } else if (Args[1] == `-cancel`) {
        await axios.get(`${Client.config.firebase_url}/currently-open/${Message.author.id}.json`)
        .then(async function (response) {
            if (response.data !== null && response.data.open == true) {
                db.ref(`currently-open/${Message.author.id}`).set({
                    open: null
                })
                var CancelledEmbed = new Discord.MessageEmbed()
                    .setColor(Color.green)
                    .setTitle(`Successfully cancelled prompt`)
                    .setDescription(`Your previous prompt has been cancelled.`);
                return Message.author.send({ embeds: [CancelledEmbed] });
            } else {
                var ErrorEmbed = new Discord.MessageEmbed()
                    .setColor(Color.red)
                    .setTitle(`Error`)
                    .setDescription(`You need an open prompt to cancel it.`);
                return Message.author.send({ embeds: [ErrorEmbed] });
            }
        })
    }

    async function DetailsFunction(Mode) {
        var Cooldown = false;

        await axios.get(`${Client.config.firebase_url}/pending-approval.json`)
        .then(function (response) {
            if (response.data !== null) {
                for (var key in response.data) {
                    if (response.data.hasOwnProperty(key)) {
                        for (var nextkey in response.data[key]) {
                            if (nextkey == `message_author` && response.data[key][nextkey] == Message.author.id) {
                                if (response.data[key].mode == Mode) {
                                    Cooldown = true;
                                }
                            } 
                        }
                    }
                }
            }
        })

        if (Cooldown == true) {
            db.ref(`currently-open/${Message.author.id}`).set({
                open: null
            })
            var ErrorEmbed = new Discord.MessageEmbed()
                .setColor(Color.red)
                .setTitle(`Error`)
                .setDescription(`You are on cooldown. You may not send any more ${Mode.toLowerCase()} approval requests until your current one has been handled. This prompt has been cancelled.`)
            return Message.author.send({ embeds: [ErrorEmbed] });
        }
        TitleDetails(Mode)

        async function TitleDetails(Mode) {
            // TITLE
            var TitleEmbed = new Discord.MessageEmbed()
                .setColor(Color.general)
                .setTitle(`${Mode} Post Title`)
                .setDescription(`Please enter a title for your post, it should summarise your description in a few words. If selling, you should also include whether you're for hire, or selling assets.`) 
            try {
                Message.author.send({ embeds: [TitleEmbed] }).then(async (Msg) => {
                    var Collector = DMChannel.createMessageCollector({ MessageFilter, max: 1, time: 300000 });
                    Collector.on(`collect`, (Collected) => {
                        if (Collected.content.toLowerCase() !== `cancel`) {
                            DescriptionDetails(Mode, Collected.content);
                        } else {
                            db.ref(`currently-open/${Message.author.id}`).set({
                                open: null
                            })
                            var CancelEmbed = new Discord.MessageEmbed()
                                .setColor(Color.red)
                                .setTitle(`Cancelled`)
                                .setDescription(`You have cancelled this prompt.`);
                            return Message.author.send({ embeds: [CancelEmbed] });
                        }
                    })
                    Collector.on(`end`, (Collected) => {
                        if (Collected.size == 0) {
                            db.ref(`currently-open/${Message.author.id}`).set({
                                open: null
                            })
                            var CancelEmbed = new Discord.MessageEmbed()
                                .setColor(Color.red)
                                .setTitle(`Cancelled`)
                                .setDescription(`This prompt has been cancelled for inactivity.`);
                            return Message.author.send({ embeds: [CancelEmbed] });
                        }
                    })
                });
            } catch (Error) {
                return Message.channel.send(`Sorry ${Message.author}, but I couldn't direct Message you!`);
            }
        }

        async function DescriptionDetails(Mode, Title) {
            // DESCRIPTION
            var DescriptionEmbed = new Discord.MessageEmbed()
                .setColor(Color.general)
                .setTitle(`${Mode} Post Description`)
                .setDescription(`Please enter a description for your post, it should br detailed, and tell the reader exactly what you want, or what you do.`);
            try {
                Message.author.send({ embeds: [DescriptionEmbed] }).then(Msg => {
                    var Collector = Msg.channel.createMessageCollector({ MessageFilter, max: 1, time: 300000 });
                    Collector.on(`collect`, (Collected) => {
                        if (Collected.content.toLowerCase() !== `cancel`) {
                            PricingDetails(Mode, Title, Collected.content);
                        } else {
                            db.ref(`currently-open/${Message.author.id}`).set({
                                open: null
                            })
                            var CancelEmbed = new Discord.MessageEmbed()
                                .setColor(Color.red)
                                .setTitle(`Cancelled`)
                                .setDescription(`You have cancelled this prompt.`);
                            return Message.author.send({ embeds: [CancelEmbed] });
                        }
                    })
                    Collector.on(`end`, (Collected) => {
                        if (Collected.size == 0) {
                            db.ref(`currently-open/${Message.author.id}`).set({
                                open: null
                            })
                            var CancelEmbed = new Discord.MessageEmbed()
                                .setColor(Color.red)
                                .setTitle(`Cancelled`)
                                .setDescription(`This prompt has been cancelled for inactivity.`);
                            return Message.author.send({ embeds: [CancelEmbed] });
                        }
                    })
                });
            } catch (Error) {
                return Message.channel.send(`Sorry ${Message.author}, but I couldn't direct Message you!`);
            }
        }

        async function PricingDetails(Mode, Title, Description) {
            // PRICING
            var PricingEmbed = new Discord.MessageEmbed()
                .setColor(Color.general)
                .setTitle(`${Mode} Post Pricing`)
                .setDescription(`Please provide pricing: how much you're buying assets for, how much you're hiring for, or accepted payment methods. Please provide currencies that include, but are not limited to, USD, GBP, and EUR.`);
            try {
                Message.author.send({ embeds: [PricingEmbed] }).then(Msg => {
                    var Collector = Msg.channel.createMessageCollector({ MessageFilter, max: 1, time: 300000 });
                    Collector.on(`collect`, (Collected) => {
                        if (Collected.content.toLowerCase() !== `cancel`) {
                            ContactDetails(Mode, Title, Description, Collected.content);
                        } else {
                            db.ref(`currently-open/${Message.author.id}`).set({
                                open: null
                            })
                            var CancelEmbed = new Discord.MessageEmbed()
                                .setColor(Color.red)
                                .setTitle(`Cancelled`)
                                .setDescription(`You have cancelled this prompt.`);
                            return Message.author.send({ embeds: [CancelEmbed] });
                        }
                    })
                    Collector.on(`end`, (Collected) => {
                        if (Collected.size == 0) {
                            db.ref(`currently-open/${Message.author.id}`).set({
                                open: null
                            })
                            var CancelEmbed = new Discord.MessageEmbed()
                                .setColor(Color.red)
                                .setTitle(`Cancelled`)
                                .setDescription(`This prompt has been cancelled for inactivity.`);
                            return Message.author.send({ embeds: [CancelEmbed] });
                        }
                    })
                });
            } catch (Error) {
                return Message.channel.send(`Sorry ${Message.author}, but I couldn't direct Message you!`);
            }
        }

        async function ContactDetails(Mode, Title, Description, Pricing) {
            // CONTACT
            if (Mode !== `Selling` && Mode !== `Portfolio`) {
                var ContactEmbed = new Discord.MessageEmbed()
                    .setColor(Color.general)
                    .setTitle(`${Mode} Post Contact Details`)
                    .setDescription(`Please provide contact details for your post. Anyone who is interested should know who to reach out to. Please only provide a user ID.\nTo find a user's ID, you need to turn on Developer Mode in Settings and then Right Click on the user and press "Copy ID" from the menu. If you're giving multiple IDs, separate each by a space.`);
                try {
                    Message.author.send({ embeds: [ContactEmbed] }).then(Msg => {
                        var Collector = Msg.channel.createMessageCollector({ MessageFilter, max: 1, time: 300000 });
                        Collector.on(`collect`, (Collected) => {
                            if (Collected.content.toLowerCase() !== `cancel`) {
                                var ArrayNotNumber = false;
                                var ContactsArray = Collected.content.split(/[ ]+/);
                                Array.from(new Set(ContactsArray));
                                for (i = 0; i < ContactsArray.length && ArrayNotNumber == false; i++) {
                                    var ContactId = ContactsArray[i].trim();
                                    if (isNaN(ContactId)) {
                                        ArrayNotNumber = true;
                                    }
                                }
    
                                if (ArrayNotNumber == true) {
                                    db.ref(`currently-open/${Message.author.id}`).set({
                                        open: null
                                    })
                                    var ErrorEmbed = new Discord.MessageEmbed()
                                        .setColor(Color.red)
                                        .setTitle(`Error`)
                                        .setDescription(`One or more of your contact IDs are not numbers. This prompt has been cancelled.`);
                                    return Message.author.send({ embeds: [ErrorEmbed] });
                                } else {
                                    var Contact = ContactsArray;
                                    AttachmentDetails(Mode, Title, Description, Pricing, Contact);
                                }
                            } else {
                                db.ref(`currently-open/${Message.author.id}`).set({
                                    open: null
                                })
                                var CancelEmbed = new Discord.MessageEmbed()
                                    .setColor(Color.red)
                                    .setTitle(`Cancelled`)
                                    .setDescription(`You have cancelled this prompt.`);
                                return Message.author.send({ embeds: [CancelEmbed] });
                            }
                        })
                        Collector.on(`end`, (Collected) => {
                            if (Collected.size == 0) {
                                db.ref(`currently-open/${Message.author.id}`).set({
                                    open: null
                                })
                                var CancelEmbed = new Discord.MessageEmbed()
                                    .setColor(Color.red)
                                    .setTitle(`Cancelled`)
                                    .setDescription(`This prompt has been cancelled for inactivity.`);
                                return Message.author.send({ embeds: [CancelEmbed] });
                            }
                        })
                    });
                } catch (Error) {
                    return Message.channel.send(`Sorry ${Message.author}, but I couldn't direct Message you!`);
                }
            } else {
                AttachmentDetails(Mode, Title, Description, Pricing, [`${Message.author.id}`]);
            }
        }

        async function AttachmentDetails(Mode, Title, Description, Pricing, Contact) {
            // ATTACHMENTS
            var AttachmentEmbed = new Discord.MessageEmbed()
                .setColor(Color.general)
                .setTitle(`${Mode} Post Attachments`)
                .setDescription(`All posts are required to have either a single link or a single attachment but not both. If a user wishes to post more than one link/attachment then they must compile them into one link on a sharing site (devforum/imgur/deviantart/twitter/etc.). If a product is wishing to be bought it may provide a single link that briefly explaining the product wishing to be made or a brief description describing it. A devforum post link is recommended for large hiring posts, somewhat like a project outline and such.`);
            try {
                Message.author.send({ embeds: [AttachmentEmbed] }).then(Msg => {
                    var Collector = Msg.channel.createMessageCollector({ MessageFilter, max: 1, time: 300000 });
                    Collector.on(`collect`, (Collected) => {
                        if (Collected.content.toLowerCase() !== `cancel`) {
                            if ([...(Collected.attachments.values())].length > 0) {
                                var Attachment = Collected.attachments.first();
                                var AttachmentType = `Image`;
                                PostApproval(false, Mode, Title, Description, Pricing, Contact, Attachment, AttachmentType);
                            } else if (Collected.content.startsWith(`https://` || `http://`) && !Collected.content.startsWith(`https://cdn.discordapp.com/attachments/`)) {
                                var Attachment = Collected.content.split(/[ ]+/)[0];
                                var AttachmentType = `Link`;
                                PostApproval(false, Mode, Title, Description, Pricing, Contact, Attachment, AttachmentType);
                            } else if (Collected.content.startsWith(`https://cdn.discordapp.com/attachments/`)) {
                                var Attachment = Collected.content.split(/[ ]+/)[0];
                                var AttachmentType = `ImageLink`;
                                PostApproval(false, Mode, Title, Description, Pricing, Contact, Attachment, AttachmentType);
                            } else {
                                db.ref(`currently-open/${Message.author.id}`).set({
                                    open: null
                                })
                                var ErrorEmbed = new Discord.MessageEmbed()
                                    .setColor(Color.red)
                                    .setTitle(`Error`)
                                    .setDescription(`You need to provide an image or a link. This prompt has been cancelled.`);
                                return Message.author.send({ embeds: [ErrorEmbed] });
                            }
                        } else {
                            db.ref(`currently-open/${Message.author.id}`).set({
                                open: null
                            })
                            var CancelEmbed = new Discord.MessageEmbed()
                                .setColor(Color.red)
                                .setTitle(`Cancelled`)
                                .setDescription(`You have cancelled this prompt.`);
                            return Message.author.send({ embeds: [CancelEmbed] });
                        }
                    })
                    Collector.on(`end`, (Collected) => {
                        if (Collected.size == 0) {
                            db.ref(`currently-open/${Message.author.id}`).set({
                                open: null
                            })
                            var CancelEmbed = new Discord.MessageEmbed()
                                .setColor(Color.red)
                                .setTitle(`Cancelled`)
                                .setDescription(`This prompt has been cancelled for inactivity.`);
                            return Message.author.send({ embeds: [CancelEmbed] });
                        }
                    })
                });
            } catch (Error) {
                return Message.channel.send(`Sorry ${Message.author}, but I couldn't direct Message you!`);
            }
        }
    }

    async function PostApproval(Repeat, Mode, Title, Description, Pricing, Contact, Attachment, AttachmentType) {
        const UserApprovalEmbed = new Discord.MessageEmbed()
            .setColor(Color.general)
            .setTitle(`${Mode} Post Requested Approval`)
            .setDescription(`Your ${Mode} post has been requested for approval, please be patient, as it needs to be manually accepted by a Marketplace Moderator.`);
        await Message.author.send({ embeds: [UserApprovalEmbed] });

        const RandomCharacter = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
        const ApprovalId = `${RandomCharacter[Math.floor(Math.random() * RandomCharacter.length)]}${RandomCharacter[Math.floor(Math.random() * RandomCharacter.length)]}${RandomCharacter[Math.floor(Math.random() * RandomCharacter.length)]}${RandomCharacter[Math.floor(Math.random() * RandomCharacter.length)]}`;

        if (Repeat == false) {
            var FormattedContact = ``;
            for (i = 0; i < Contact.length; i++) {
                if (i > 0) {
                    FormattedContact = `${FormattedContact} <@!${Contact[i]}>`;
                } else {
                    FormattedContact = `<@!${Contact[i]}>`;
                }
            }
        } else if (Repeat == true) {
            var FormattedContact = Contact;
        }

        const ApprovalEmbed = new Discord.MessageEmbed()
            .setColor(Color.general)
            .setAuthor(Message.author.tag, Message.author.displayAvatarURL())
            .setTitle(`${Mode} Post Request ${ApprovalId}`)

        if (AttachmentType == `Image`) {
            ApprovalEmbed.setDescription(`**Title** - ${Title}\n**Description** - ${Description}\n\n**Pricing** - ${Pricing}\n**Contact Details** - ${FormattedContact}`)
            ApprovalEmbed.setImage(`${Attachment.proxyURL}`)
        } else if (AttachmentType == `ImageLink`) {
            ApprovalEmbed.setDescription(`**Title** - ${Title}\n**Description** - ${Description}\n\n**Pricing** - ${Pricing}\n**Contact Details** - ${FormattedContact}`)
            ApprovalEmbed.setImage(`${Attachment}`)
        } else if (AttachmentType == `Link`) {
            ApprovalEmbed.setDescription(`**Title** - ${Title}\n**Description** - ${Description}\n\n**Pricing** - ${Pricing}\n**Contact Details** - ${FormattedContact}\n**Link** - ${Attachment}`);
        }

        await ApprovalChannel.send({ embeds: [ApprovalEmbed] }).then(sent => {
            db.ref(`pending-approval/${ApprovalId}`).set({
                message_author: Message.author.id,
                message: sent.id,
                mode: Mode,
                title: Title,
                description: Description,
                pricing: Pricing,
                contact: FormattedContact,
                attachment_type: AttachmentType,
                attachment: Attachment
            })

            db.ref(`repeat-storage/${Message.author.id}`).set({
                mode: Mode,
                title: Title,
                description: Description,
                pricing: Pricing,
                contact: FormattedContact,
                attachment_type: AttachmentType,
                attachment: Attachment
            })

            db.ref(`currently-open/${Message.author.id}`).set({
                open: null
            })

            db.ref(`metrics`).set({
                submit_run: SubmitRun + 1,
                submissions: Submissions + 1,
                approved_submissions: ApprovedSubmissions,
                declined_submissions: DeclinedSubmissions
            })
        })
    }
};

exports.info = {
    names: ["submit"],
    groups: ["m", "marketplace"],
    usage: 'submit (-cancel/-repeat)',
    description: 'Send an approval request for a post'
};
