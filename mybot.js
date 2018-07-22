/*jshint esversion: 6 */ 
const { HLTV } = require('hltv');
const async = require('async');
const Discord = require("discord.js");
const client = new Discord.Client();
const auth = require("./auth.json");
const rp = require('request-promise');
const cheerio = require('cheerio');
const steam = require('steamidconvert')(auth.steamAPIKey);



//Arrays to store values for https://www.hltv.org/results
let winners = [];
let losers = [];
let result = [];
let tournament = [];
let matches = [];
let matchNum = [];
let links = [];
let finalmatches = [];

//Arrays to store values for specific matches
let players = [];
let plusMinus = [];
let adr = [];
let rating = [];
let kill = [];
let death = [];
let team_names = [];
let overall = [];
  
//Constructor to keep all match information in one place
function match(win_team, lose_team, score, event_name, match_number, link_id){
  this.win_team = win_team;
  this.lose_team = lose_team;
  this.score = score;
  this.event_name = event_name;
  this.match_number = match_number;
  this.link_id = link_id;
}

//Constructor to keep all player statistics in one place
function player(names, kill_num, death_num, plus, ad, rate, team){
  this.names = names;
  this.kill_num = kill_num;
  this.death_num = death_num;
  this.plus = plus;
  this.ad = ad;
  this.rate = rate;
  this.team = team;
}
let totalMatches = 0;

//Bot is active and basically searches for a message
client.on("message", (message) => {
    //Constraints for the message so that the bot can react to it
    //Separates the '!' and the text
    const args = message.content.slice(auth.prefix.length).trim().split(/ +/g);
    //Converts the separated string into lower case so that all inputs are treated the same despite typos
    const command = args.shift().toLowerCase();
    if (!message.content.startsWith(auth.prefix) || message.author.bot) return;
  
    //Main command
    if(command == 'hltv'){
      const website = {
        uri: 'https://www.hltv.org/results',
        transform: function(body){
          //Loads in the HTML 
          return cheerio.load(body);
        }
      };
      
      
      rp(website)
      .then(($) => {
        //In the webpage ID 3760 is the part that has the featured matches
        $('#3760').each(function(i,elem){
          //Finding specific classes within the id
          //Lucky for me, they contained only the necessary information
          let teams = $(this).find('.result-con');
          teams.each(function(i, elem){
            winners.push($(this).find('.team-won').text());
            //Some times the losers of the match would be in different sides and there wasn't a 'team-lost' class
            //So if team2 was the team that won, then the other team would be pushed to the loser array
            if($(this).find('.team2').text().replace(/\s/g, '') == $(this).find('.team-won').text().replace(/\s/g, '')){
              losers.push($(this).find('.team1').text().replace(/\s/g, ''));
            }
            else{
              losers.push($(this).find('.team2').text().replace(/\s/g, ''));
            }
      
            let scores = $(this).find('.result-score').text();
            result.push(scores);
      
            let events = $(this).find('.event-name').text();
            tournament.push(events);
            
            totalMatches = i + 1;

            for(let match_num = 1; match_num <= totalMatches; match_num++){
              matchNum.push(match_num);
            }

            let href = "https://www.hltv.org" + $(this).children().attr("href");
            links.push(href);
              
          });
          
          for(let j = 0; j < totalMatches; j++){
            matches[j] = new match(winners[j], losers[j], result[j], tournament[j], matchNum[j], links[j]);  
          }
                
        });
        //Sends embeded message to the channel
        for(let k = 0; k < totalMatches; k++){
          message.channel.send(new Discord.RichEmbed()
          .setTitle("Featured Matches on HLTV")
          .setDescription("Match # " + (k+1))
          .setColor("RANDOM")
          .addField("Winning team", matches[k].win_team, true)
          .addField("Score", matches[k].score, true)
          .addField("Loser", matches[k].lose_team, true)
          .addField("Event", matches[k].event_name, true));    
        }
        //Needed a way to ask user a question and then use the answer to determine the next step
        //IDEA: Use emojis as answer response answers
        message.channel.send("Which match do you want to see in more detail? Please enter match number.");
        //Bot reads the message and determines what to do based on what is said
        //User has 50000 ms (50 s) to use
        const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 50000 });
        collector.on('collect', message => { 
          
          if (Number(message.content) <= totalMatches && Number(message.content) > 0 || || message.content.startsWith(auth.prefix)) {
                       // PLAYER INFORMATION START //
            const options = {
              uri: links[Number(message.content)-1],
              transform: function (body) {
                return cheerio.load(body);
              }
            };
  
            rp(options)
              .then(($) => {
                $('.player-nick').each(function(i,elem){
                  let player_names = $(this).text();
                  if(players.indexOf(player_names) === -1){
                    players.push(player_names);
                  } 
                });

                $('.kd').each(function(i,elem){
                  let dash_position = $(this).text().indexOf("-");
                  let kills = $(this).text().slice(0, dash_position);
                  let deaths = $(this).text().slice(dash_position+1);
                  
                  if(!isNaN(kills.charAt(0)) && kill.length < 10){
                    kill.push(kills);
                  }
                  if(!isNaN(deaths.charAt(0)) && death.length < 10){
                    death.push(deaths);
                  }
                });

                $('.plus-minus').each(function(i,elem){
                  let plus_minus = $(this).text();
                  if(!isNaN(plus_minus.charAt(1)) && plusMinus.length < 10){
                    plusMinus.push(plus_minus);
                  } 
                });

                $('.adr').each(function(i,elem){
                  let adr_num = $(this).text();
                  if(!isNaN(adr_num.charAt(1)) && adr.length < 10){
                    adr.push(adr_num);
                  } 
                });

                $('.rating').each(function(i,elem){
                  let rating_num = $(this).text();
                  if(!isNaN(rating_num.charAt(3)) && rating.length < 10){
                    rating.push(rating_num);
                  } 
                });

                $('.teamName').each(function(i,elem){
                  let team_name = $(this).text();
                  if(team_names.indexOf(team_name) === -1){
                    team_names.push(team_name);
                  }
                });

                for(let j = 0; j < 10; j++){
                  overall[j] = new player(players[j], kill[j], death[j], plusMinus[j], adr[j], rating[j]);
                  
                }
                //Team 1
                for(let w = 0; w < 5; w++){
                  overall[w].team = team_names[0];
                }
                //Team 2
                for(let w = 5; w < 10; w++){
                  overall[w].team = team_names[1];
                }

                //Team 1 Embeded Messages
                for(let k = 0; k < 5; k++){
                  
                  message.channel.send(new Discord.RichEmbed()
                  .setTitle(overall[k].names)
                  .setDescription(overall[k].team)
                  .setColor("BLACK")
                  .addField("Kills", overall[k].kill_num, true)
                  .addField("Deaths", overall[k].death_num, true)
                  .addField("K/D Ratio", Math.round(Number(overall[k].kill_num) / Number(overall[k].death_num) * 100) / 100, true)
                  .addBlankField()
                  .addField("Plus Minus", overall[k].plus, true)
                  .addField("ADR", overall[k].ad, true)
                  .addField("Rating", overall[k].rate, true));
                  }

                //Team 2 Embeded Messages
                for(let k = 5; k < 10; k++){
                  message.channel.send(new Discord.RichEmbed()
                  .setTitle(overall[k].names)
                  .setDescription(overall[k].team)
                  .setColor([255,255,255])
                  .addField("Kills", overall[k].kill_num, true)
                  .addField("Deaths", overall[k].death_num, true)
                  .addField("K/D Ratio", Math.round(Number(overall[k].kill_num) / Number(overall[k].death_num) * 100) / 100, true)
                  .addBlankField()
                  .addField("Plus Minus", overall[k].plus, true)
                  .addField("ADR,", overall[k].ad, true)
                  .addField("Rating", overall[k].rate, true));
                  }
              
              });
                      // PLAYER INFORMATION END //

          }
          else{
            message.channel.send("Invalid Match Number");
          }
            
        });
      
      });

    }
  if(command === "stats"){
      let [username] = args;    
      
      let steamid = steam.convertVanity(username, function(err, res) {
        
          if(err){
            message.channel.send("Invalid username");
          }
          else{
            const csgostats = {
              uri: 'https://csgostats.gg/player/' + res,
              transform: function(body){
                return cheerio.load(body);
              }
            };
            
            

            rp(csgostats)
            .then(($) => {
              let personal = new Discord.RichEmbed();

              $('#kpd').each(function(i, elem){
                console.log(($(this).text().replace(/\s/g, '')));
                personal.addField("K/D Ratio", ($(this).text().replace(/\s/g, '')), true);
              });
              $('#rating').each(function(i, elem){
                console.log(($(this).text().replace(/\s/g, '')));
                personal.addField("Rating", ($(this).text().replace(/\s/g, '')), true);
              });
              $('#competitve-wins').each(function(i, elem){
                console.log(($(this).text().replace(/[^\d]/g, '')));
                personal.addField("Competitive Wins" ,($(this).text().replace(/[^\d]/g, '')), true);
                
              });
              //Clutch Success
              $('.stat-panel').each(function(i, elem){
                //console.log(($(this).text().replace(/\s/g, '')));
                
                if(($(this).text().replace(/\s/g, '')).startsWith("ClutchSuccess")){
                  let beginning = $(this).text().replace(/\s/g, '').indexOf('X');
                  let end = $(this).text().replace(/\s/g, '').indexOf('%');
                  console.log($(this).text().replace(/\s/g, '').slice(beginning+1, end));
                  personal.addField("Clutch Success", ($(this).text().replace(/\s/g, '').slice(beginning+1, end)) + '%', true);
                }
                

              });

              //ADR
              $('.stat-panel').each(function(i, elem){
                if(($(this).text().replace(/\s/g, '')).startsWith("ADR")){
                  let beginning = $(this).text().replace(/\s/g, '').indexOf('R');
                  let end = $(this).text().replace(/\s/g, '').indexOf('a');
                  console.log($(this).text().replace(/\s/g, '').slice(beginning+1, end-1));
                  personal.addField("ADR", ($(this).text().replace(/\s/g, '').slice(beginning+1, end-1)), true);
                }    
              });
            
              //Win Rate
              $('.stat-panel').each(function(i, elem){
                if(($(this).text().replace(/\s/g, '')).startsWith("WinRate")){
                  let beginning = $(this).text().replace(/\s/g, '').indexOf('e');
                  let end = $(this).text().replace(/\s/g, '').indexOf('%');
                  console.log($(this).text().replace(/\s/g, '').slice(beginning+1, end));
                  personal.addField("Win Rate", ($(this).text().replace(/\s/g, '').slice(beginning+1, end)) + '%', true);
            
                }    
              });


               //Most played maps
               $('.stat-panel').each(function(i, elem){
                if(($(this).text().replace(/\s/g, '')).startsWith("MostPlayed")){
                 
                  let maps = $(this).text().replace(/\s/g, '').replace(/[0-9]/g, "").split("de_");
                  maps.shift();
                  //personal.addField("Most Played", ($(this).text().replace(/\s/g, '').slice(beginning+1, end)), true);
                    personal.addBlankField();
                    personal.addField("Most Played Maps", maps, true);
                    
                }
                 
              });

              message.channel.send(personal);


            });

              
          }
          

        });
      


    }
      //Example, temporary command
      if (command === "asl") {
        let [age, sex, location] = args;
        message.reply(`Hello ${message.author.username}, I see you're a ${age} year old ${sex} from ${location}. Wanna date?`);
      }
      
      if(command === "kick") {
        let member = message.mentions.members.first() || message.guild.members.get(args[0]);
        if(!member)
          return message.reply("Please mention a valid member of this server");
        let reason = args.slice(1).join(' ');
        if(!reason) reason = "No reason provided";
        
        member.kick(reason);
        message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);
    
      }
  });

  client.on('guildMemberAdd', member => {
    member.guild.channels.get('463869359350218767').send('**' + member.user.username + '**, has joined the server! Welcome!'); 
});

client.login(auth.token); 
