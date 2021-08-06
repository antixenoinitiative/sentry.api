//one mechan (M) equal 864 s

const Discord = require("discord.js");
module.exports = {
	name: 'mtos',
	description: 'how much mechans in given time and vice versa',
    format: '[*h](;:,.)[*m](;:,.)[*s]|[*M]',
	permlvl: 0,
	restricted: false,
	execute(message, args) {
		try {
            sourceUnits = ""
            function inputAnalisys(input)
            {
                var inputTimeList = []
                inputTimeList = input.split(";:,.")
                var timeObject = {}
                if ("s" in input) 
                {
                    var sourceUnits  = "standartTime"
                    //assuming that is usual time, which needed to be converted to mechan
                    for (var i=0;i<inputTimeList.length;i++)
                    {
                        timeObject[inputTimeList[i].replace(/\W/g,'')] = parseInt(inputTimeList[i].replace(/\D/g,''),10)  //assigning to key named after time unit given time
                    } 
                    var seconds = timeObject["h"]*60*60+timeObject["m"]*60+timeObject["s"]
                    var mechan = seconds/864
                    var response = "Converted time to standart time, result is " + mechan + "mechans."
					return response
                }
                else ("m" in input)
                {
                    sourceUnits  = "mechan"
                    //assuming that is mechan units, which needed to be converted to standart time
                    for (var i=0;i<inputTimeList.length;i++)
                    {
                        timeObject[inputTimeList[i].replace(/\W/g,'')] = parseInt(inputTimeList[i].replace(/\D/g,''),10) //assigning to key named after time unit given time
                    }
                    var mechan = timeObject["M"]
                    var full_date = new Date(null)
                    var seconds = mechan*864
                    full_date.setSeconds(seconds)
                    var days = full_date.getDate()
                    var hours = full_date.getHours()
                    var minutes = full_date.getMinutes()
                    var seconds = full_date.getSeconds()
                    var response = "Converted mechans to standart time, result is "
                    if (days !=0) {response = response + days + "day(s)" }
                    if (hours !=0) {response = response + hours + "hour(s)"}
                    if (minutes !=0) {response = response + minutes + "minute(s)"} 
                    if (seconds !=0) {response = response + seconds + "second(s)"} 
					return response + "."
                }
            }




			const returnEmbed = new Discord.MessageEmbed()
			.setColor('#FF7100')
            .setAuthor('The Anti-Xeno Initiative', "https://cdn.discordapp.com/attachments/860453324959645726/865330887213842482/AXI_Insignia_Hypen_512.png")
            .setTitle("**Conveerter**")
			var result = inputAnalisys(args)
            returnEmbed.addField(result)
			message.channel.send(returnEmbed.setTimestamp());
		} catch(err) {
			message.channel.send(`Something went wrong: -mtos ${args}: result ${result} \n ERROR: ${err}`)
		}
	},
};
