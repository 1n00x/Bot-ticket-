const Discord = require("discord.js")
const axios = require("axios")
const config = require("./token.json")

const client = new Discord.Client({ 
  intents: [ 
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.GuildMembers,
    '32767'
       ]
    });

module.exports = client

client.on('interactionCreate', (interaction) => {

  if(interaction.type === Discord.InteractionType.ApplicationCommand){

      const cmd = client.slashCommands.get(interaction.commandName);

      if (!cmd) return interaction.reply(`Error`);

      interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);

      cmd.run(client, interaction)

   }
})
client.on('ready', () => {
  console.log(`🎉 Ligado com sucesso em ${client.user.username} com acesso à ${client.users.cache.size} membros`)
  client.user.setPresence({
    activities: [{
        name: `👀 Zend Applications`,
        type: Discord.ActivityType["Watching"],
        url: "https://discord.gg/afm44GNvP9"
    }]
  })

  if (client.guilds.cache.size > 1) {
    let firstGuild = true;
    client.guilds.cache.forEach(guild => {
        if (firstGuild) {
            firstGuild = false;
        } else {
            guild.leave()
                .then(() => console.log(`Saiu do servidor ${guild.name}`))
                .catch(console.error);
        }
    });
  }
})
client.on('guildCreate', guild => {
  console.log(`Bot entrou em um novo servidor: ${guild.name}.`);
  if (client.guilds.cache.size > 1) {
      guild.leave()
          .then(() => console.log(`Saiu do servidor ${guild.name}`))
          .catch(console.error);
  }
});
client.on("interactionCreate", async interaction => {
  if(interaction.isAutocomplete()) {
    const command = client.slashCommands.get(interaction.commandName)
    if(!command) {
      return;
    }
    

    try{
      await command.autocomplete(interaction);
    }catch(err){return;}
  }
});

client.slashCommands = new Discord.Collection()

require('./handler')(client)

client.login(config.token)
client.on('messageCreate',  async (msg) => {
  const { JsonDatabase } = require("wio.db")
  const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
  const db = new JsonDatabase({ databasePath: "./json/data_ticket.json"})
  if (db.get(`${msg.channel.id}`)) {
    const user = msg.author;
    if (user.bot) return;

    let users = db.get(`${msg.channel.id}.logsUsers`)
    const id = users.find(element => element.id === user.id);
    if(!id) {
      db.push(`${msg.channel.id}.logsUsers`, {
        name: user.username,
        avatar: user.displayAvatarURL({ dynamic: true }),
        id: user.id
      })
    }
    if (msg.reference) {
      // Obtém a mensagem original
      const orgmsg = await msg.channel.messages.fetch(msg.reference.messageId);
      if (orgmsg.author.bot) return;
      db.push(`${msg.channel.id}.logs`, {
        id: user.id,
        msg: msg.content,
        date: new Date(),
        resp: true,
        respContent: orgmsg.content
      })
      return
    }
    db.push(`${msg.channel.id}.logs`, {
      id: user.id,
      msg: msg.content,
      date: new Date(),
      resp: false
    })
  }
})
client.on('messageCreate',  async (message) => {
  if (message.author.bot) return;
  const { JsonDatabase } = require("wio.db")
  const dbc = new JsonDatabase({ databasePath: "./json/botconfig.json"})
  if (dbc.get(`sugest.sistema`) !== "ON") return;

  // Buscar a mensagem específica e reagir a ela
  const channelId = dbc.get(`sugest.channel`)
  if (message.channel.id === channelId) {
    const channel = client.channels.cache.get(channelId)
    await message.react(dbc.get(`sugest.certo`))
    await message.react(dbc.get(`sugest.errado`))
    const user = message.author;
    // Crie um tópico a partir da mensagem
    const thread = await message.startThread({
      name: `Sugestão de ${user.displayName}`,
      autoArchiveDuration: 10080, // duração em minutos (60, 1440, 4320, 10080)
      reason: `Sugestão de ${user.displayName}`
    });

    // Envie uma mensagem para o tópico
    await thread.send(`Olá ${user} 👋, obrigado por enviar sua sugestão! Caso necessário, explique melhor a mesma.`);
  }
});

client.on("interactionCreate", require('./events/botconfig').run);
client.on("interactionCreate", require('./events/config').run);
client.on("interactionCreate", require('./events/setpainel').run);
client.on("interactionCreate", require('./events/paineis').run);
client.on("interactionCreate", require('./events/ticket').run);
client.on("interactionCreate", require('./events/sistemaavalia').run);
client.on("interactionCreate", require('./events/abrir-ticket').run);
client.on("interactionCreate", require('./events/ticket-finalizar').run);
client.on("interactionCreate", require('./events/assumir').run);
client.on("interactionCreate", require('./events/logsSystem').run);



process.on('multipleResolutions', (type, reason, promise) => {
  console.log(`Err:\n` + type, promise, reason);
});
process.on('unhandledRejection', (reason, promise) => {
  console.log(`Err:\n` + reason, promise);
});
process.on('uncaughtException', (error, origin) => {
  console.log(`Err:\n` + error, origin);
});
process.on('uncaughtExceptionMonitor', (error, origin) => {
  console.log(`Err:\n` + error, origin);
 });


