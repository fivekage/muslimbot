const {readdirSync} = require('fs');

module.exports = {
  loadAllCommands: (directory = './commands') => {
    const commands = [];
    const dirs = readdirSync(directory);
    for (const dir of dirs) {
      if (!dir.match('_general')) {
        commandsFileName = readdirSync(`${directory}/${dir}`).filter((files) => files.endsWith('.js'));
        for (const file of commandsFileName) {
          const getFileName = require(`../${directory}/${dir}/${file}`);
          const {name} = getFileName.help;
          commands.push({
            name,
            description: getFileName.help.description,
            options: getFileName.help.options,
            choices: getFileName.help.choices,
            file: getFileName,
          });
        }
      }
    }

    return commands;
  },
};
