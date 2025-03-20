require("dotenv").config();
const { Telegraf } = require("telegraf");
const { Contact, initDB } = require("./models/contact");

const bot = new Telegraf(process.env.BOT_TOKEN);

function getFullName(user) {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';

    if (firstName && lastName) {
        return `${firstName} ${lastName}`;
    } else if (firstName) {
        return firstName;
    } else if (lastName) {
        return lastName;
    } else {
        return 'Unknown';
    }
}

async function addUserToDB(member, groupType) {
    const telegramId = member.id;
    const username = member.username;
    const fullName = getFullName(member);
    const phone = member.phone || null;

    try {
        const contact = await Contact.create({
            telegram_id: telegramId,
            username: username || null,
            full_name: fullName,
            phone: phone,
            group_type: groupType,
            external_id: `USR${Date.now().toString(36).toUpperCase()}`
        });

        console.log(`✅ Пользователь ${telegramId} (${fullName}) добавлен в БД (группа: ${groupType})`);
        return true;
    } catch (error) {
        console.error("❌ Ошибка при добавлении в БД:", error);
        return false;
    }
}

async function removeUserFromDB(telegramId, groupType) {
    try {
        const deletedCount = await Contact.destroy({
            where: {
                telegram_id: telegramId,
                group_type: groupType
            }
        });

        if (deletedCount > 0) {
            console.log(`❌ Пользователь ${telegramId} удалён из группы "${groupType}" в БД`);
            return true;
        } else {
            console.log(`⚠️ Запись пользователя ${telegramId} в группе "${groupType}" не найдена`);
            return false;
        }
    } catch (error) {
        console.error("❌ Ошибка при удалении из БД:", error);
        return false;
    }
}

bot.on("message", async (ctx) => {
    try {
        if (ctx.message.new_chat_members) {
            for (const member of ctx.message.new_chat_members) {
                const fullName = getFullName(member);
                console.log(`👤 Новый участник: ID=${member.id}, Имя="${fullName}", Username="@${member.username || "unknown"}", Группа="${ctx.chat.title}"`);
                await addUserToDB(member, ctx.chat.title);
            }
        }

        if (ctx.message.left_chat_member) {
            const member = ctx.message.left_chat_member;
            const fullName = getFullName(member);
            console.log(`👋 Участник покинул группу: ID=${member.id}, Имя="${fullName}", Username="@${member.username || "unknown"}", Группа="${ctx.chat.title}"`);
            await removeUserFromDB(member.id, ctx.chat.title);
        }
    } catch (error) {
        console.error("❌ Ошибка в обработчике:", error);
    }
});

(async () => {
    await initDB();
    bot.launch().then(() => console.log("🤖 Бот запущен (простое отслеживание участников групп)"));
})();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));