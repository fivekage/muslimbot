'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // SQL statement to create or replace the view
    const createViewSQL = `
      CREATE OR REPLACE VIEW CommandStatisticsView AS
      SELECT 
          commandName,
          COUNT(DISTINCT guildId) * 100 / (SELECT COUNT(*) FROM Guilds) AS usedInGuildsPercentage,
          COUNT(*) AS totalUses,
          COUNT(DISTINCT userId) AS distinctUsers,
          MAX(createdAt) AS lastUsedAt,
          DATEDIFF(NOW(), MIN(createdAt)) / COUNT(*) AS avgUsesPerDay
      FROM 
          CommandsActivities
      GROUP BY 
          commandName, guildId;
    `;
    // Execute the SQL statement
    await queryInterface.sequelize.query(createViewSQL);
  },

  down: async (queryInterface, Sequelize) => {
    // SQL statement to drop the view
    const dropViewSQL = `DROP VIEW IF EXISTS CommandStatisticsView;`;
    // Execute the SQL statement
    await queryInterface.sequelize.query(dropViewSQL);
  },
};
