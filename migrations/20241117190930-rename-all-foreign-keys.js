'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {

    // Helper function to check if a column exists
    const columnExists = async (table, column) => {
      const tableInfo = await queryInterface.describeTable(table);
      return tableInfo[column] !== undefined;
    };

    // Rename columns only if they exist
    if (await columnExists('QuizzAnswers', 'QuizzQuestionId')) {
      await queryInterface.renameColumn('QuizzAnswers', 'QuizzQuestionId', 'questionId');
    }
    if (await columnExists('Subscriptions', 'UserId')) {
      await queryInterface.renameColumn('Subscriptions', 'UserId', 'userId');
    }
    if (await columnExists('Notifications', 'SubscriptionId')) {
      await queryInterface.renameColumn('Notifications', 'SubscriptionId', 'subscriptionId');
    }
    if (await columnExists('Notifications', 'UserId')) {
      await queryInterface.renameColumn('Notifications', 'UserId', 'userId');
    }

    // Add foreign key constraints
    await queryInterface.addConstraint('QuizzAnswers', {
      fields: ['questionId'],
      type: 'foreign key',
      name: 'fk_QuizzAnswers_questionId',
      references: {
        table: 'QuizzQuestions',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('Subscriptions', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_Subscriptions_userId',
      references: {
        table: 'Users',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('Notifications', {
      fields: ['subscriptionId'],
      type: 'foreign key',
      name: 'fk_Notifications_subscriptionId',
      references: {
        table: 'Subscriptions',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('Notifications', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_Notifications_userId',
      references: {
        table: 'Users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Helper function to check if a constraint exists
    const constraintExists = async (table, constraintName) => {
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
         WHERE TABLE_NAME = :table AND CONSTRAINT_NAME = :constraint`,
        {
          replacements: { table, constraint: constraintName },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      return !!constraints;
    };

    // Revert column renames
    if (await columnExists('QuizzAnswers', 'questionId')) {
      await queryInterface.renameColumn('QuizzAnswers', 'questionId', 'QuizzQuestionId');
    }
    if (await columnExists('Subscriptions', 'userId')) {
      await queryInterface.renameColumn('Subscriptions', 'userId', 'UserId');
    }
    if (await columnExists('Notifications', 'subscriptionId')) {
      await queryInterface.renameColumn('Notifications', 'subscriptionId', 'SubscriptionId');
    }
    if (await columnExists('Notifications', 'userId')) {
      await queryInterface.renameColumn('Notifications', 'userId', 'UserId');
    }

    // Remove constraints only if they exist
    if (await constraintExists('QuizzAnswers', 'fk_QuizzAnswers_questionId')) {
      await queryInterface.removeConstraint('QuizzAnswers', 'fk_QuizzAnswers_questionId');
    }
    if (await constraintExists('Subscriptions', 'fk_Subscriptions_userId')) {
      await queryInterface.removeConstraint('Subscriptions', 'fk_Subscriptions_userId');
    }
    if (await constraintExists('Notifications', 'fk_Notifications_subscriptionId')) {
      await queryInterface.removeConstraint('Notifications', 'fk_Notifications_subscriptionId');
    }
    if (await constraintExists('Notifications', 'fk_Notifications_userId')) {
      await queryInterface.removeConstraint('Notifications', 'fk_Notifications_userId');
    }
  },
};
