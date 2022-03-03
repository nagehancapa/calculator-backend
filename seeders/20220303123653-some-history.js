"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "histories",
      [
        {
          expression: "3+5",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 1,
        },
        {
          expression: "3-2/5",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 2,
        },
        {
          expression: "3*5+0.2",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 1,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("histories", null, {});
  },
};
