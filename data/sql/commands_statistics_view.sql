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