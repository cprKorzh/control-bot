const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false
});

const Contact = sequelize.define("Contact", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    telegram_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true
    },
    group_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    added_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    },
    external_id: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: "contacts",
    timestamps: false
});

async function initDB(retries = 5, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            await sequelize.authenticate();
            await sequelize.sync({ alter: true });
            console.log("✅ База данных синхронизирована");
            return;
        } catch (error) {
            console.error(`❌ Ошибка подключения к БД (попытка ${i + 1}/${retries}):`, error);
            if (i < retries - 1) {
                console.log(`⏳ Повторное подключение через ${delay / 1000} сек...`);
                await new Promise(res => setTimeout(res, delay));
            } else {
                console.error("🚨 Не удалось подключиться к базе данных. Проверь настройки!");
                process.exit(1);
            }
        }
    }
}

module.exports = { Contact, sequelize, initDB };